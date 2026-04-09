import { Injectable } from '@nestjs/common'
import { ActivitiesService } from '../activities/activities.service'
import { RecoveryService } from '../recovery/recovery.service'
import { MetricsService } from '../metrics/metrics.service'
import { RecommendationEngine } from '../recommendations/recommendation-engine'
import { InsightsService } from '../insights/insights.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { TrainingSessionEntity } from '../activities/training-session.entity'
import { ReadinessScoreEntity } from '../metrics/readiness-score.entity'
import type { TodayDashboard, WeeklyDashboard, SportType } from '@athleteos/types'

@Injectable()
export class DashboardService {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly recoveryService: RecoveryService,
    private readonly metricsService: MetricsService,
    private readonly recommendationEngine: RecommendationEngine,
    private readonly insightsService: InsightsService,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepo: Repository<TrainingSessionEntity>,
    @InjectRepository(ReadinessScoreEntity)
    private readonly readinessRepo: Repository<ReadinessScoreEntity>,
  ) {}

  async getToday(userId: string): Promise<TodayDashboard> {
    const today = new Date().toISOString().split('T')[0]

    // Calculate readiness if not yet done today
    let readiness = await this.metricsService.getTodayReadiness(userId)
    if (!readiness) {
      readiness = await this.metricsService.calculateAndStoreReadiness(userId)
    }

    // Get or generate recommendation
    let recommendation = null
    try {
      recommendation = await this.recommendationEngine.generateDailyRecommendation(userId, today)
    } catch {
      // Recommendation generation may fail if no readiness score exists yet
    }

    // Parallel fetches for remaining data
    const [lastActivity, lastRecovery, unreadInsights] = await Promise.all([
      this.activitiesService.getLastActivity(userId),
      this.recoveryService.getLatestRecovery(userId),
      this.insightsService.getUnread(userId),
    ])

    // Weekly summary
    const monday = getMonday()
    const [loadPlanned, loadActual, sessionsThisWeek] = await Promise.all([
      // Planned load from recommendations (sum of load_target this week)
      Promise.resolve(0), // TODO: from weekly plan
      this.activitiesService.getWeeklyLoad(userId, monday),
      this.sessionsRepo.count({
        where: {
          user_id: userId,
          started_at: Between(monday, new Date()),
        },
      }),
    ])

    return {
      readiness: readiness as any,
      recommendation: recommendation as any,
      last_activity: lastActivity as any,
      last_recovery: lastRecovery as any,
      unread_insights: unreadInsights as any[],
      weekly_summary: {
        load_planned: loadPlanned,
        load_actual: Math.round(loadActual),
        sessions_planned: 6, // TODO: from weekly plan
        sessions_completed: sessionsThisWeek,
      },
    }
  }

  async getWeek(userId: string, weekStart?: string): Promise<WeeklyDashboard> {
    const monday = weekStart ? new Date(weekStart) : getMonday()
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 7)

    const [sessions, readinessScores] = await Promise.all([
      this.sessionsRepo.find({
        where: {
          user_id: userId,
          started_at: Between(monday, sunday),
        },
        order: { started_at: 'ASC' },
      }),
      this.readinessRepo.find({
        where: {
          user_id: userId,
          // date between monday and sunday
        },
        order: { date: 'ASC' },
        take: 7,
      }),
    ])

    // Build day-by-day load breakdown
    const loadByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLoad = sessions
        .filter(s => s.started_at.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + (s.training_load ?? 0), 0)

      return {
        date: dateStr,
        planned: 0, // TODO: from weekly plan
        actual: Math.round(dayLoad),
      }
    })

    // Sport breakdown
    const sportMap = new Map<string, { duration_seconds: number; load: number }>()
    for (const session of sessions) {
      const entry = sportMap.get(session.sport_type) ?? { duration_seconds: 0, load: 0 }
      entry.duration_seconds += session.duration_seconds
      entry.load += session.training_load ?? 0
      sportMap.set(session.sport_type, entry)
    }

    const sportBreakdown = Array.from(sportMap.entries()).map(([sport, data]) => ({
      sport: sport as SportType,
      duration_seconds: data.duration_seconds,
      load: Math.round(data.load),
    }))

    const totalDistance = sessions.reduce((sum, s) => sum + (s.distance_meters ?? 0), 0)
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)

    return {
      plan: null, // TODO: from weekly plan
      sessions: sessions as any[],
      readiness_scores: readinessScores as any[],
      load_by_day: loadByDay,
      total_distance_km: Math.round(totalDistance / 100) / 10,
      total_duration_hours: Math.round(totalDuration / 360) / 10,
      sport_breakdown: sportBreakdown,
    }
  }
}

function getMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
