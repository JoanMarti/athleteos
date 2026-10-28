import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import type {
  DailyRecommendation, WorkoutStructure, SessionType,
  IntensityZone, GoalType, ReadinessLabel,
} from '@athleteos/types'
import { calculateATL, calculateCTL, calculateTSB } from '@athleteos/utils'
import { TrainingSessionEntity } from '../activities/training-session.entity'
import { ReadinessScoreEntity } from '../metrics/readiness-score.entity'
import { GoalEntity } from '../users/goal.entity'
import { AthleteProfileEntity } from '../users/athlete-profile.entity'
import { DailyRecommendationEntity } from './daily-recommendation.entity'

// ─────────────────────────────────────────────────────────────────────────────
// Rule definitions
// ─────────────────────────────────────────────────────────────────────────────

interface RuleContext {
  readiness: ReadinessScoreEntity
  profile: AthleteProfileEntity
  goal: GoalEntity | null
  todayDayOfWeek: number // 0=Sun, 1=Mon, ...6=Sat
  recentSessions: TrainingSessionEntity[]
  consecutiveHighLoadDays: number
  weeksToGoal: number | null
}

interface RuleOutput {
  type: SessionType
  sport: DailyRecommendation['sport']
  title: string
  description: string
  duration_target_minutes: number
  intensity_target: IntensityZone
  load_target: number
  workout_structure?: WorkoutStructure
  reason: string
  ruleId: string
}

@Injectable()
export class RecommendationEngine {
  private readonly logger = new Logger(RecommendationEngine.name)

  constructor(
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepo: Repository<TrainingSessionEntity>,
    @InjectRepository(ReadinessScoreEntity)
    private readonly readinessRepo: Repository<ReadinessScoreEntity>,
    @InjectRepository(GoalEntity)
    private readonly goalsRepo: Repository<GoalEntity>,
    @InjectRepository(AthleteProfileEntity)
    private readonly profileRepo: Repository<AthleteProfileEntity>,
    @InjectRepository(DailyRecommendationEntity)
    private readonly recommendationRepo: Repository<DailyRecommendationEntity>,
  ) {}

  /**
   * Generate today's recommendation for a user.
   * Applies rules in priority order, returns first match.
   */
  async generateDailyRecommendation(userId: string, date: string): Promise<DailyRecommendationEntity> {
    const ctx = await this.buildContext(userId, date)
    const output = this.applyRules(ctx)

    // Check if recommendation already exists for today
    const existing = await this.recommendationRepo.findOneBy({ user_id: userId, date })
    if (existing && existing.status !== 'pending') {
      return existing // Don't overwrite accepted/completed recommendations
    }

    const recommendation = this.recommendationRepo.create({
      user_id: userId,
      date,
      type: output.type,
      sport: output.sport,
      title: output.title,
      description: output.description,
      duration_target_minutes: output.duration_target_minutes,
      intensity_target: output.intensity_target,
      load_target: output.load_target,
      workout_structure: output.workout_structure ?? null,
      reason: output.reason,
      confidence: ctx.readiness.confidence,
      rule_ids: [output.ruleId],
      status: 'pending',
    })

    return this.recommendationRepo.save(recommendation)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rules — ordered by priority (first match wins)
  // ─────────────────────────────────────────────────────────────────────────

  private applyRules(ctx: RuleContext): RuleOutput {
    const { readiness, profile, goal, consecutiveHighLoadDays } = ctx
    const { score, tsb, label } = readiness

    // R001 — CRITICAL: TSB far below safe zone → mandatory rest
    if (tsb < -35 || consecutiveHighLoadDays >= 6) {
      return {
        ruleId: 'R001', type: 'rest', sport: 'rest',
        title: 'Complete rest day',
        description: 'Your body is showing signs of accumulated fatigue. Full rest will allow better adaptation and prevent injury.',
        duration_target_minutes: 0, intensity_target: 'z1', load_target: 0,
        reason: `TSB at ${tsb} — fatigue is too high to train productively. Rest is training.`,
      }
    }

    // R002 — Poor readiness → recovery session only
    if (label === 'poor' || label === 'rest_day' || score < 35) {
      return this.buildRecoverySession(ctx, 'R002', 'Low readiness score and HRV indicate insufficient recovery.')
    }

    // R003 — Friday + prior 4 heavy days → force easy/rest
    if (ctx.todayDayOfWeek === 5 && consecutiveHighLoadDays >= 3) {
      return this.buildRecoverySession(ctx, 'R003', 'You\'ve had 3+ hard days this week. Friday is your recovery window.')
    }

    // R004 — Tapering phase (within 2 weeks of race goal)
    if (ctx.weeksToGoal !== null && ctx.weeksToGoal <= 2 && goal?.type === 'race_preparation') {
      return this.buildTaperSession(ctx)
    }

    // R005 — Moderate readiness → Z2 base
    if (score < 55 || tsb < -15) {
      return this.buildEnduranceSession(ctx, 'R005', 'Moderate recovery — build aerobic base without adding stress.')
    }

    // R006 — Good readiness + FTP goal → threshold work
    if (score >= 70 && goal?.type === 'ftp_improvement' && profile.ftp_watts) {
      return this.buildThresholdSession(ctx)
    }

    // R007 — Good readiness + race prep + good TSB → VO2max or tempo
    if (score >= 70 && goal?.type === 'race_preparation' && tsb > -10) {
      return this.buildVO2maxSession(ctx)
    }

    // R008 — Optimal readiness → key session (most intense appropriate for goal)
    if (label === 'optimal' && score >= 82) {
      return this.buildKeySession(ctx)
    }

    // R009 — Default: moderate endurance session
    return this.buildEnduranceSession(ctx, 'R009', 'Good conditions for a solid aerobic session.')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session builders
  // ─────────────────────────────────────────────────────────────────────────

  private buildRecoverySession(ctx: RuleContext, ruleId: string, reason: string): RuleOutput {
    const sport = ctx.profile.primary_sport === 'cycling' ? 'cycling' : 'running'
    return {
      ruleId, type: 'recovery', sport,
      title: sport === 'cycling' ? 'Easy spin — Z1 recovery' : 'Very easy jog or walk',
      description: sport === 'cycling'
        ? 'Keep HR below Z2. No surges, no hills. This session is about blood flow, not training.'
        : 'Walk-jog mix, conversational pace only. Stop if HR exceeds Z2.',
      duration_target_minutes: 40,
      intensity_target: 'z1', load_target: 25,
      workout_structure: {
        main: [{ type: 'steady', duration_seconds: 2400, target_hr_zone: 'z1', description: 'Steady Z1 — feel the legs without loading them' }],
      },
      reason,
    }
  }

  private buildEnduranceSession(ctx: RuleContext, ruleId: string, reason: string): RuleOutput {
    const { profile } = ctx
    const sport = profile.primary_sport === 'cycling' ? 'cycling' : 'running'
    const ftpNote = profile.ftp_watts ? ` Target 60-70% FTP (${Math.round(profile.ftp_watts * 0.65)}–${Math.round(profile.ftp_watts * 0.70)}W).` : ''
    return {
      ruleId, type: 'easy', sport,
      title: sport === 'cycling' ? 'Aerobic endurance ride — Z2' : 'Easy aerobic run — Z2',
      description: `Steady Z2 effort throughout. Keep conversation possible.${ftpNote} No intensity above Z2.`,
      duration_target_minutes: 75,
      intensity_target: 'z2', load_target: 55,
      workout_structure: {
        warmup: { type: 'warmup', duration_seconds: 600, target_hr_zone: 'z1', description: 'Gradual warmup' },
        main: [{ type: 'steady', duration_seconds: 3600, target_hr_zone: 'z2', description: 'Steady aerobic — Z2 throughout' }],
        cooldown: { type: 'cooldown', duration_seconds: 300, target_hr_zone: 'z1', description: 'Easy cooldown' },
      },
      reason,
    }
  }

  private buildThresholdSession(ctx: RuleContext): RuleOutput {
    const { profile } = ctx
    const ftp = profile.ftp_watts!
    const intervals = 5
    const intervalDuration = 8 * 60 // 8 minutes
    const restDuration = 3 * 60

    return {
      ruleId: 'R006', type: 'key_session', sport: 'cycling',
      title: `Threshold intervals — ${intervals}×8min`,
      description: `${intervals} intervals of 8 minutes at 95–105% FTP (${Math.round(ftp * 0.95)}–${Math.round(ftp * 1.05)}W). Full recovery between each. This is your key FTP-building session.`,
      duration_target_minutes: 75,
      intensity_target: 'z4', load_target: 95,
      workout_structure: {
        warmup: { type: 'warmup', duration_seconds: 900, target_hr_zone: 'z2', description: '15min progressive warmup, ending at Z3' },
        main: Array.from({ length: intervals }, (_, i) => ([
          {
            type: 'interval' as const,
            duration_seconds: intervalDuration,
            target_power_pct_ftp: 1.0,
            target_hr_zone: 'z4' as IntensityZone,
            description: `Interval ${i + 1}/${intervals} — hold ${Math.round(ftp * 0.95)}–${Math.round(ftp * 1.05)}W`,
          },
          {
            type: 'rest' as const,
            duration_seconds: restDuration,
            target_hr_zone: 'z1' as IntensityZone,
            description: 'Full rest — spin easy',
          },
        ])).flat().slice(0, -1), // Remove last rest
        cooldown: { type: 'cooldown', duration_seconds: 600, target_hr_zone: 'z1', description: '10min easy cooldown' },
      },
      reason: `Readiness ${ctx.readiness.score}/100 and FTP goal — ideal conditions for threshold work.`,
    }
  }

  private buildVO2maxSession(ctx: RuleContext): RuleOutput {
    const sport = ctx.profile.primary_sport
    const isRun = sport === 'running' || sport === 'triathlon'

    return {
      ruleId: 'R007', type: 'key_session', sport: isRun ? 'running' : 'cycling',
      title: isRun ? 'VO2max run intervals — 6×3min' : 'VO2max bike efforts — 6×3min',
      description: isRun
        ? '6 intervals of 3 minutes at ~5K race pace (or perceived max aerobic effort). 3min jog recovery between each.'
        : `6 intervals at 110–120% FTP (${ctx.profile.ftp_watts ? Math.round(ctx.profile.ftp_watts * 1.15) : '~'}W). 3min easy spin recovery.`,
      duration_target_minutes: 65,
      intensity_target: 'z5', load_target: 88,
      workout_structure: {
        warmup: { type: 'warmup', duration_seconds: 900, target_hr_zone: 'z2' },
        main: Array.from({ length: 6 }, (_, i) => ([
          { type: 'interval' as const, duration_seconds: 180, target_power_pct_ftp: 1.15, target_hr_zone: 'z5' as IntensityZone, description: `VO2max effort ${i + 1}/6` },
          { type: 'rest' as const, duration_seconds: 180, target_hr_zone: 'z1' as IntensityZone, description: 'Active recovery' },
        ])).flat().slice(0, -1),
        cooldown: { type: 'cooldown', duration_seconds: 600, target_hr_zone: 'z1' },
      },
      reason: `Race prep phase + strong readiness (${ctx.readiness.score}/100) — push VO2max capacity.`,
    }
  }

  private buildTaperSession(ctx: RuleContext): RuleOutput {
    const weeksToGoal = ctx.weeksToGoal!
    const intensity = weeksToGoal <= 1 ? 'z2' : 'z3'
    const duration = weeksToGoal <= 1 ? 45 : 60
    return {
      ruleId: 'R004_TAPER', type: 'easy', sport: ctx.profile.primary_sport,
      title: `Taper session — ${weeksToGoal}w to race`,
      description: `Maintain sharpness without accumulating fatigue. Short activation efforts, mostly Z2. ${weeksToGoal <= 1 ? 'Race week: keep it light!' : 'Reduce volume 30% vs last week.'}`,
      duration_target_minutes: duration,
      intensity_target: intensity as IntensityZone, load_target: weeksToGoal <= 1 ? 30 : 50,
      reason: `${weeksToGoal} week(s) to your race — taper protocol active.`,
    }
  }

  private buildKeySession(ctx: RuleContext): RuleOutput {
    // Delegate to the most appropriate key session based on goal
    if (ctx.goal?.type === 'ftp_improvement' && ctx.profile.ftp_watts) {
      return this.buildThresholdSession(ctx)
    }
    return this.buildVO2maxSession(ctx)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Context builder
  // ─────────────────────────────────────────────────────────────────────────

  private async buildContext(userId: string, date: string): Promise<RuleContext> {
    const [readiness, profile, goal, recentSessions] = await Promise.all([
      this.readinessRepo.findOneByOrFail({ user_id: userId, date }),
      this.profileRepo.findOneByOrFail({ user_id: userId }),
      this.goalsRepo.findOneBy({ user_id: userId, is_primary: true, status: 'active' }),
      this.sessionsRepo.find({
        where: {
          user_id: userId,
          started_at: Between(
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            new Date(),
          ),
        },
        order: { started_at: 'DESC' },
      }),
    ])

    // Count consecutive days with high load (load > 70)
    let consecutiveHighLoadDays = 0
    const sortedSessions = [...recentSessions].sort((a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    for (const s of sortedSessions) {
      if ((s.training_load ?? 0) > 70) consecutiveHighLoadDays++
      else break
    }

    // Weeks to goal
    let weeksToGoal: number | null = null
    if (goal?.target_date) {
      const msToGoal = new Date(goal.target_date).getTime() - Date.now()
      weeksToGoal = Math.max(0, Math.ceil(msToGoal / (7 * 24 * 60 * 60 * 1000)))
    }

    return {
      readiness,
      profile,
      goal,
      todayDayOfWeek: new Date(date).getDay(),
      recentSessions,
      consecutiveHighLoadDays,
      weeksToGoal,
    }
  }
}
