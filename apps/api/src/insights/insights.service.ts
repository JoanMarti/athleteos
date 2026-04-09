import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ImprovementInsightEntity } from './improvement-insight.entity'
import { TrainingSessionEntity } from '../activities/training-session.entity'
import { ReadinessScoreEntity } from '../metrics/readiness-score.entity'

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name)

  constructor(
    @InjectRepository(ImprovementInsightEntity)
    private readonly insightsRepo: Repository<ImprovementInsightEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepo: Repository<TrainingSessionEntity>,
    @InjectRepository(ReadinessScoreEntity)
    private readonly readinessRepo: Repository<ReadinessScoreEntity>,
  ) {}

  async getUnread(userId: string): Promise<ImprovementInsightEntity[]> {
    return this.insightsRepo.find({
      where: { user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
      take: 10,
    })
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    await this.insightsRepo.update(
      ids.map(id => ({ id, user_id: userId })) as any,
      { is_read: true },
    )
  }

  /**
   * Run all insight detectors for a user.
   * Called after each sync and daily at 5am.
   */
  async detectInsights(userId: string): Promise<void> {
    await Promise.all([
      this.detectOvertrainingRisk(userId),
      this.detectPerformancePRs(userId),
      this.detectAerobicEfficiencyTrend(userId),
    ])
  }

  // ─── Insight detectors ──────────────────────────────────────────────────────

  private async detectOvertrainingRisk(userId: string): Promise<void> {
    const readinessLast5 = await this.readinessRepo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
      take: 5,
    })

    if (readinessLast5.length < 3) return

    const lowHRVDays = readinessLast5.filter(r => (r.hrv_component ?? 100) < 35).length
    const latestTSB = readinessLast5[0].tsb ?? 0

    if (lowHRVDays >= 3 || latestTSB < -30) {
      const alreadyExists = await this.insightsRepo.findOne({
        where: {
          user_id: userId,
          insight_type: 'overtraining_risk',
          is_read: false,
        },
      })
      if (alreadyExists) return // Don't spam

      await this.insightsRepo.save(this.insightsRepo.create({
        user_id: userId,
        insight_type: 'overtraining_risk',
        metric: 'tsb',
        title: latestTSB < -30
          ? 'Overtraining risk — TSB critically low'
          : 'HRV declining — monitor recovery closely',
        body: latestTSB < -30
          ? `Your Training Stress Balance is at ${latestTSB}. This indicates accumulated fatigue that may impair adaptation and increase injury risk.`
          : `HRV has been below your baseline for ${lowHRVDays} of the last 5 days. Your body is signalling it needs more recovery time.`,
        severity: latestTSB < -35 ? 'alert' : 'warning',
        action_suggested: 'Add 1-2 extra rest days this week and reduce intensity. Consider consulting a coach if this persists.',
        data_points: {
          tsb: latestTSB,
          low_hrv_days: lowHRVDays,
          readiness_scores: readinessLast5.map(r => ({ date: r.date, score: r.score })),
        },
      }))
    }
  }

  private async detectPerformancePRs(userId: string): Promise<void> {
    // Look for best normalized power in last 7 days vs. previous 30 days
    const recentBest = await this.sessionsRepo
      .createQueryBuilder('s')
      .select('MAX(s.normalized_power_watts)', 'max_np')
      .addSelect('MAX(s.training_load)', 'max_load')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.sport_type = :sport', { sport: 'cycling' })
      .andWhere("s.started_at >= NOW() - INTERVAL '7 days'")
      .getRawOne()

    const historicalBest = await this.sessionsRepo
      .createQueryBuilder('s')
      .select('MAX(s.normalized_power_watts)', 'max_np')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.sport_type = :sport', { sport: 'cycling' })
      .andWhere("s.started_at < NOW() - INTERVAL '7 days'")
      .andWhere("s.started_at >= NOW() - INTERVAL '90 days'")
      .getRawOne()

    const recentNP = parseFloat(recentBest?.max_np ?? '0')
    const historicalNP = parseFloat(historicalBest?.max_np ?? '0')

    if (recentNP > 0 && historicalNP > 0 && recentNP > historicalNP * 1.02) {
      const improvement = Math.round(recentNP - historicalNP)
      const pctImprovement = Math.round(((recentNP - historicalNP) / historicalNP) * 100)

      const alreadyExists = await this.insightsRepo.findOne({
        where: { user_id: userId, insight_type: 'pr_detected', is_read: false },
      })
      if (alreadyExists) return

      await this.insightsRepo.save(this.insightsRepo.create({
        user_id: userId,
        insight_type: 'pr_detected',
        metric: 'normalized_power_watts',
        title: `New power PR — +${improvement}W normalized power`,
        body: `Your best normalized power this week (${Math.round(recentNP)}W) exceeds your previous 90-day best (${Math.round(historicalNP)}W) by ${pctImprovement}%. Your FTP may have improved.`,
        severity: 'info',
        action_suggested: 'Consider scheduling an FTP test in the next 1-2 weeks to update your training zones.',
        data_points: { recent_np: recentNP, historical_np: historicalNP, improvement_pct: pctImprovement },
      }))
    }
  }

  private async detectAerobicEfficiencyTrend(userId: string): Promise<void> {
    // Compare power:HR ratio in Z2 rides over last 4 weeks vs. previous 4 weeks
    const recentRatio = await this.sessionsRepo
      .createQueryBuilder('s')
      .select('AVG(s.average_power_watts::float / NULLIF(s.average_hr_bpm, 0))', 'ratio')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.sport_type = :sport', { sport: 'cycling' })
      .andWhere('s.average_power_watts IS NOT NULL')
      .andWhere('s.average_hr_bpm IS NOT NULL')
      .andWhere("s.started_at >= NOW() - INTERVAL '28 days'")
      .getRawOne()

    const previousRatio = await this.sessionsRepo
      .createQueryBuilder('s')
      .select('AVG(s.average_power_watts::float / NULLIF(s.average_hr_bpm, 0))', 'ratio')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.sport_type = :sport', { sport: 'cycling' })
      .andWhere('s.average_power_watts IS NOT NULL')
      .andWhere('s.average_hr_bpm IS NOT NULL')
      .andWhere("s.started_at >= NOW() - INTERVAL '56 days'")
      .andWhere("s.started_at < NOW() - INTERVAL '28 days'")
      .getRawOne()

    const recent = parseFloat(recentRatio?.ratio ?? '0')
    const previous = parseFloat(previousRatio?.ratio ?? '0')

    if (recent > 0 && previous > 0) {
      const pctChange = Math.round(((recent - previous) / previous) * 100)

      if (pctChange >= 4) {
        // Meaningful aerobic improvement
        await this.insightsRepo.save(this.insightsRepo.create({
          user_id: userId,
          insight_type: 'performance_gain',
          metric: 'power_hr_ratio',
          title: `Aerobic efficiency up ${pctChange}% this month`,
          body: `Your power-to-heart-rate ratio has improved ${pctChange}% over the last 4 weeks compared to the previous 4 weeks. You're producing more power at the same cardiovascular effort — a strong sign of aerobic adaptation.`,
          severity: 'info',
          action_suggested: 'Keep consistent Z2 volume. Your base is building well.',
          data_points: { recent_ratio: recent, previous_ratio: previous, pct_change: pctChange },
        }))
      } else if (pctChange <= -6) {
        await this.insightsRepo.save(this.insightsRepo.create({
          user_id: userId,
          insight_type: 'performance_drop',
          metric: 'power_hr_ratio',
          title: 'Aerobic efficiency declining',
          body: `Your power-to-heart-rate ratio has dropped ${Math.abs(pctChange)}% over the last 4 weeks. You're working harder for the same output — this may indicate accumulated fatigue or reduced aerobic conditioning.`,
          severity: 'warning',
          action_suggested: 'Increase Z1-Z2 volume and ensure recovery weeks are truly easy.',
          data_points: { recent_ratio: recent, previous_ratio: previous, pct_change: pctChange },
        }))
      }
    }
  }
}
