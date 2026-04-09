import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ReadinessScoreEntity } from './readiness-score.entity'
import { ActivitiesService } from '../activities/activities.service'
import { RecoveryService } from '../recovery/recovery.service'
import { calculateReadinessScore, calculateATL, calculateCTL } from '@athleteos/utils'

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name)

  constructor(
    @InjectRepository(ReadinessScoreEntity)
    private readonly readinessRepo: Repository<ReadinessScoreEntity>,
    private readonly activitiesService: ActivitiesService,
    private readonly recoveryService: RecoveryService,
  ) {}

  async calculateAndStoreReadiness(userId: string, date?: string): Promise<ReadinessScoreEntity> {
    const targetDate = date ?? new Date().toISOString().split('T')[0]
    const existing = await this.readinessRepo.findOneBy({ user_id: userId, date: targetDate })
    if (existing) return existing

    const [sessions42d, latestRecovery, hrvBaseline, recentScores] = await Promise.all([
      this.activitiesService.findRecent(userId, 42),
      this.recoveryService.getLatestRecovery(userId),
      this.recoveryService.getHRVBaseline(userId),
      this.recoveryService.getLastNRecoveryScores(userId, 3),
    ])

    const sessionsMapped = sessions42d.map(s => ({
      started_at: s.started_at.toISOString(),
      training_load: s.training_load,
    }))

    const atl = calculateATL(sessionsMapped, 7)
    const ctl = calculateCTL(sessionsMapped, 42)

    const load7d = sessions42d
      .filter(s => s.started_at > new Date(Date.now() - 7 * 86400000))
      .reduce((sum, s) => sum + (s.training_load ?? 0), 0)

    const load28d = sessions42d
      .filter(s => s.started_at > new Date(Date.now() - 28 * 86400000))
      .reduce((sum, s) => sum + (s.training_load ?? 0), 0)

    const readinessData = calculateReadinessScore({
      hrv_ms: latestRecovery?.hrv_ms ?? undefined,
      hrv_30d_avg: hrvBaseline?.avg,
      hrv_30d_stddev: hrvBaseline?.stddev,
      sleep_score: latestRecovery?.recovery_score ?? undefined,
      atl,
      ctl,
      recovery_scores_last_3d: recentScores.length > 0 ? recentScores : undefined,
    })

    const entity = this.readinessRepo.create({
      user_id: userId,
      date: targetDate,
      score: readinessData.score,
      hrv_component: readinessData.hrv_component,
      sleep_component: readinessData.sleep_component,
      load_component: readinessData.load_component,
      recovery_trend_component: readinessData.recovery_trend_component,
      label: readinessData.label,
      confidence: readinessData.confidence,
      training_load_7d: load7d,
      training_load_28d: load28d,
      atl,
      ctl,
      tsb: readinessData.tsb,
    })

    return this.readinessRepo.save(entity)
  }

  async getTodayReadiness(userId: string): Promise<ReadinessScoreEntity | null> {
    const today = new Date().toISOString().split('T')[0]
    return this.readinessRepo.findOneBy({ user_id: userId, date: today })
  }

  async getReadinessTrend(userId: string, days = 30): Promise<ReadinessScoreEntity[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    return this.readinessRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.date >= :since', { since: sinceStr })
      .orderBy('r.date', 'ASC')
      .getMany()
  }
}
