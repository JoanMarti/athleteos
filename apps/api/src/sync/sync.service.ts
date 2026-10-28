import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConnectedAccountEntity } from '../connected-accounts/connected-account.entity'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    @InjectQueue('sync') private readonly syncQueue: Queue,
    @InjectRepository(ConnectedAccountEntity)
    private readonly accountRepo: Repository<ConnectedAccountEntity>,
  ) {}

  /**
   * Queue an immediate sync for a specific user + provider.
   * Called from the manual sync endpoint and after webhook events.
   */
  async triggerSync(userId: string, provider: string): Promise<{ jobId: string | number }> {
    const account = await this.accountRepo.findOneBy({
      user_id: userId,
      provider: provider as any,
      is_active: true,
    })

    if (!account) {
      throw new Error(`No active ${provider} account for user ${userId}`)
    }

    const job = await this.syncQueue.add('backfill', {
      userId,
      provider,
      accountId: account.id,
      daysBack: 7, // Recent sync: only 7 days
    }, {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    })

    return { jobId: job.id }
  }

  /**
   * Daily 5:00 AM UTC cron — sync all active users.
   * Runs before athletes wake up, so dashboard is fresh.
   */
  @Cron('0 5 * * *', { timeZone: 'UTC' })
  async dailySyncAllUsers() {
    this.logger.log('Starting daily sync for all active users')

    const accounts = await this.accountRepo
      .createQueryBuilder('a')
      .select('DISTINCT a.user_id', 'user_id')
      .where('a.is_active = true')
      .getRawMany()

    for (const { user_id } of accounts) {
      await this.syncQueue.add('daily-sync', { userId: user_id }, {
        priority: 10, // Lower priority than manual syncs
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        // Spread jobs over 30 minutes to avoid API rate limits
        delay: Math.floor(Math.random() * 30 * 60 * 1000),
      })
    }

    this.logger.log(`Queued daily sync for ${accounts.length} users`)
  }

  async getSyncStatus(userId: string, provider: string) {
    return this.accountRepo.findOne({
      where: { user_id: userId, provider: provider as any },
      select: ['sync_status', 'last_sync_at', 'error_message', 'is_active'],
    })
  }
}
