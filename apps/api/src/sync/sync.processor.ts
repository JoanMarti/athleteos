import { Process, Processor, OnQueueFailed } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { ConnectedAccountEntity } from '../connected-accounts/connected-account.entity'
import { EncryptionService } from '../common/encryption.service'
import { StravaAdapter } from './strava.adapter'
import { WhoopAdapter } from './whoop.adapter'
import { ActivitiesService } from '../activities/activities.service'
import { RecoveryService } from '../recovery/recovery.service'
import { MetricsService } from '../metrics/metrics.service'
import { UsersService } from '../users/users.service'

interface SyncJobData {
  userId: string
  provider: 'strava' | 'whoop'
  accountId: string
  daysBack?: number
  activityId?: string // for webhook-triggered single-activity sync
}

@Processor('sync')
export class SyncProcessor {
  private readonly logger = new Logger(SyncProcessor.name)

  constructor(
    @InjectRepository(ConnectedAccountEntity)
    private readonly accountRepo: Repository<ConnectedAccountEntity>,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
    private readonly stravaAdapter: StravaAdapter,
    private readonly whoopAdapter: WhoopAdapter,
    private readonly activitiesService: ActivitiesService,
    private readonly recoveryService: RecoveryService,
    private readonly metricsService: MetricsService,
    private readonly usersService: UsersService,
  ) {}

  @Process('backfill')
  async handleBackfill(job: Job<SyncJobData>) {
    const { userId, provider, accountId, daysBack = 90 } = job.data
    this.logger.log(`Starting ${provider} backfill for user ${userId} (${daysBack}d)`)

    await this.accountRepo.update(accountId, { sync_status: 'syncing' })

    try {
      const account = await this.accountRepo.findOneByOrFail({ id: accountId })
      const accessToken = this.encryption.decrypt(account.access_token_encrypted)
      const useMock = this.config.get(`ENABLE_${provider.toUpperCase()}_MOCK`) === 'true'

      const sinceTimestamp = Math.floor(Date.now() / 1000) - daysBack * 86400
      const sinceDate = new Date(Date.now() - daysBack * 86400000).toISOString()

      const profile = await this.usersService.getProfile(userId)

      if (provider === 'strava') {
        const activities = await this.stravaAdapter.fetchActivitiesSince(
          accessToken, sinceTimestamp, useMock,
        )

        let processed = 0
        for (const raw of activities) {
          const normalized = this.stravaAdapter.normalize(raw, userId, profile)
          await this.activitiesService.upsertFromProvider(normalized)
          processed++
          await job.progress(Math.round((processed / activities.length) * 80))
        }

        this.logger.log(`Strava backfill: ${processed} activities synced for user ${userId}`)
      }

      if (provider === 'whoop') {
        const [recoveries, sleep] = await Promise.all([
          this.whoopAdapter.fetchRecoveries(accessToken, sinceDate, useMock),
          this.whoopAdapter.fetchSleep(accessToken, sinceDate, useMock),
        ])

        for (const raw of recoveries) {
          const normalized = this.whoopAdapter.normalizeRecovery(raw, userId)
          await this.recoveryService.upsertRecovery(normalized)
        }

        for (const raw of sleep) {
          const normalized = this.whoopAdapter.normalizeSleep(raw, userId)
          await this.recoveryService.upsertSleep(normalized)
        }

        await job.progress(90)
        this.logger.log(`WHOOP backfill: ${recoveries.length} recoveries, ${sleep.length} sleep records for user ${userId}`)
      }

      // Recalculate today's readiness after data is loaded
      await this.metricsService.calculateAndStoreReadiness(userId)
      await job.progress(100)

      await this.accountRepo.update(accountId, {
        sync_status: 'success',
        last_sync_at: new Date(),
        error_message: null,
      })
    } catch (err: any) {
      await this.accountRepo.update(accountId, {
        sync_status: 'error',
        error_message: err.message ?? 'Unknown sync error',
      })
      throw err
    }
  }

  @Process('daily-sync')
  async handleDailySync(job: Job<{ userId: string }>) {
    const { userId } = job.data
    this.logger.log(`Daily sync for user ${userId}`)

    const accounts = await this.accountRepo.find({
      where: { user_id: userId, is_active: true },
    })

    for (const account of accounts) {
      // Only sync last 7 days in daily sync (not full backfill)
      await this.handleBackfill(
        { data: { userId, provider: account.provider as any, accountId: account.id, daysBack: 7 } } as Job<SyncJobData>,
      )
    }

    await this.metricsService.calculateAndStoreReadiness(userId)
  }

  @OnQueueFailed()
  handleFailure(job: Job, err: Error) {
    this.logger.error(`Sync job ${job.id} (${job.name}) failed: ${err.message}`, err.stack)
  }
}
