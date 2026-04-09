import type {
  TrainingSession,
  RecoverySession,
  ReadinessScore,
  ReadinessLabel,
  HRZones,
  PowerZones,
  ZoneDistribution,
  Provider,
  WhoopWorkout,
} from '@athleteos/types'

// ─────────────────────────────────────────────────────────────────────────────
// Training Load Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Training Stress Score for a cycling session using power data.
 * TSS = (duration_seconds × NP × IF) / (FTP × 3600) × 100
 */
export function calculateTSS(
  durationSeconds: number,
  normalizedPowerWatts: number,
  ftpWatts: number,
): number {
  if (ftpWatts <= 0) return 0
  const intensityFactor = normalizedPowerWatts / ftpWatts
  return (durationSeconds * normalizedPowerWatts * intensityFactor) / (ftpWatts * 3600) * 100
}

/**
 * Calculate TSS from heart rate data when power is unavailable.
 * Uses TRIMP (Training Impulse) method, normalized to TSS scale.
 */
export function calculateHRTSS(
  durationSeconds: number,
  averageHR: number,
  restingHR: number,
  maxHR: number,
  gender: 'male' | 'female' | 'other' | 'prefer_not' = 'male',
): number {
  if (maxHR <= restingHR) return 0
  const hrReserve = (averageHR - restingHR) / (maxHR - restingHR)
  const genderK = gender === 'female' ? 1.67 : 1.92
  const trimp = (durationSeconds / 60) * hrReserve * 0.64 * Math.exp(genderK * hrReserve)
  // Normalize TRIMP to approximate TSS (1 hour at threshold ≈ 100 TSS)
  return trimp * 1.1
}

/**
 * Exponential Moving Average — core of ATL/CTL calculations.
 */
function ema(values: number[], timeConstant: number): number[] {
  const k = 2 / (timeConstant + 1)
  const result: number[] = []
  let prev = values[0] ?? 0
  for (const v of values) {
    const curr = v * k + prev * (1 - k)
    result.push(curr)
    prev = curr
  }
  return result
}

/**
 * Build a daily load array from sessions, filling missing days with 0.
 */
export function buildDailyLoadArray(
  sessions: Pick<TrainingSession, 'started_at' | 'training_load'>[],
  days: number,
): number[] {
  const now = new Date()
  const result = new Array(days).fill(0)

  for (const session of sessions) {
    const sessionDate = new Date(session.started_at)
    const daysAgo = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    const index = days - 1 - daysAgo
    if (index >= 0 && index < days) {
      result[index] += session.training_load ?? 0
    }
  }

  return result
}

/**
 * Acute Training Load — 7-day exponential moving average.
 * Represents short-term fatigue.
 */
export function calculateATL(
  sessions: Pick<TrainingSession, 'started_at' | 'training_load'>[],
  days = 7,
): number {
  const dailyLoad = buildDailyLoadArray(sessions, Math.max(days, 42))
  const emaValues = ema(dailyLoad, days)
  return Math.round(emaValues[emaValues.length - 1] * 10) / 10
}

/**
 * Chronic Training Load — 42-day exponential moving average.
 * Represents long-term fitness.
 */
export function calculateCTL(
  sessions: Pick<TrainingSession, 'started_at' | 'training_load'>[],
  days = 42,
): number {
  const dailyLoad = buildDailyLoadArray(sessions, days)
  const emaValues = ema(dailyLoad, days)
  return Math.round(emaValues[emaValues.length - 1] * 10) / 10
}

/**
 * Training Stress Balance = CTL - ATL
 * Positive: fresh/recovered. Negative: fatigued.
 * > 10: very fresh | -10 to 10: balanced | -20 to -10: some fatigue | < -20: overreaching
 */
export function calculateTSB(ctl: number, atl: number): number {
  return Math.round((ctl - atl) * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate heart rate training zones from LTHR (Lactate Threshold HR).
 * Based on Friel's 7-zone model, simplified to 5 for display.
 */
export function calculateHRZones(lthr: number): HRZones {
  return {
    z1: [0, Math.round(lthr * 0.81)],
    z2: [Math.round(lthr * 0.81), Math.round(lthr * 0.89)],
    z3: [Math.round(lthr * 0.89), Math.round(lthr * 0.93)],
    z4: [Math.round(lthr * 0.93), Math.round(lthr * 1.01)],
    z5: [Math.round(lthr * 1.01), 999],
  }
}

/**
 * Calculate power training zones from FTP.
 * Based on Coggan's classic 7-zone model, simplified to 6.
 */
export function calculatePowerZones(ftp: number): PowerZones {
  return {
    z1: [0, Math.round(ftp * 0.55)],          // Active Recovery
    z2: [Math.round(ftp * 0.55), Math.round(ftp * 0.74)],  // Endurance
    z3: [Math.round(ftp * 0.75), Math.round(ftp * 0.89)],  // Tempo
    z4: [Math.round(ftp * 0.90), Math.round(ftp * 1.04)],  // Threshold
    z5: [Math.round(ftp * 1.05), Math.round(ftp * 1.20)],  // VO2max
    z6: [Math.round(ftp * 1.20), 9999],         // Anaerobic
  }
}

/**
 * Get zone number (1-5) for a given HR value.
 */
export function getHRZone(hr: number, zones: HRZones): number {
  if (hr <= zones.z1[1]) return 1
  if (hr <= zones.z2[1]) return 2
  if (hr <= zones.z3[1]) return 3
  if (hr <= zones.z4[1]) return 4
  return 5
}

/**
 * Get zone number (1-6) for a given power value.
 */
export function getPowerZone(watts: number, zones: PowerZones): number {
  if (watts <= zones.z1[1]) return 1
  if (watts <= zones.z2[1]) return 2
  if (watts <= zones.z3[1]) return 3
  if (watts <= zones.z4[1]) return 4
  if (watts <= zones.z5[1]) return 5
  return 6
}

/**
 * Calculate zone distribution from a stream of HR or power values.
 */
export function calculateZoneDistribution(
  stream: number[],
  zones: HRZones | PowerZones,
  type: 'hr' | 'power',
): ZoneDistribution {
  if (stream.length === 0) {
    return { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  }

  const counts = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  for (const value of stream) {
    const zone = type === 'hr'
      ? getHRZone(value, zones as HRZones)
      : Math.min(5, getPowerZone(value, zones as PowerZones))
    counts[`z${zone}` as keyof typeof counts]++
  }

  const total = stream.length
  return {
    z1: counts.z1 / total,
    z2: counts.z2 / total,
    z3: counts.z3 / total,
    z4: counts.z4 / total,
    z5: counts.z5 / total,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Readiness Score Calculation
// ─────────────────────────────────────────────────────────────────────────────

interface ReadinessInput {
  hrv_ms?: number
  hrv_30d_avg?: number
  hrv_30d_stddev?: number
  sleep_score?: number           // 0-100
  sleep_efficiency?: number      // 0-1
  atl: number
  ctl: number
  recovery_scores_last_3d?: number[] // 0-100 each
}

/**
 * Calculate a normalized HRV component score (0-100).
 * Compares today's HRV to the user's 30-day baseline.
 */
function calculateHRVComponent(
  hrv?: number,
  avg?: number,
  stddev?: number,
): number {
  if (!hrv || !avg) return 50 // neutral if no data
  const zScore = stddev && stddev > 0 ? (hrv - avg) / stddev : (hrv - avg) / avg
  // Clamp to ±2 SD, map to 0-100
  const clamped = Math.max(-2, Math.min(2, zScore))
  return Math.round(50 + clamped * 25)
}

/**
 * Calculate sleep component from sleep score and efficiency.
 */
function calculateSleepComponent(score?: number, efficiency?: number): number {
  if (!score && !efficiency) return 50
  const s = score ?? 70
  const e = efficiency !== undefined ? efficiency * 100 : 75
  return Math.round(s * 0.7 + e * 0.3)
}

/**
 * Calculate training load component.
 * TSB > 5: excellent | 0-5: good | -10 to 0: moderate | -20 to -10: poor | <-20: very poor
 */
function calculateLoadComponent(atl: number, ctl: number): number {
  const tsb = ctl - atl
  if (tsb > 10) return 90
  if (tsb > 0) return 75
  if (tsb > -10) return 60
  if (tsb > -20) return 40
  if (tsb > -30) return 20
  return 5
}

/**
 * Calculate recovery trend from last 3 days of recovery scores.
 */
function calculateTrendComponent(scores?: number[]): number {
  if (!scores || scores.length === 0) return 50
  if (scores.length === 1) return scores[0]

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const latest = scores[scores.length - 1]
  const delta = latest - avg

  return Math.round(Math.max(0, Math.min(100, avg + delta * 0.5)))
}

/**
 * Calculate ReadinessLabel from score.
 */
export function getReadinessLabel(score: number): ReadinessLabel {
  if (score >= 80) return 'optimal'
  if (score >= 65) return 'good'
  if (score >= 45) return 'moderate'
  if (score >= 25) return 'poor'
  return 'rest_day'
}

/**
 * Main readiness score calculation.
 * Returns score (0-100), all components, and label.
 */
export function calculateReadinessScore(input: ReadinessInput): Omit<ReadinessScore, 'id' | 'user_id' | 'created_at' | 'training_load_7d' | 'training_load_28d'> {
  const hrvComponent = calculateHRVComponent(input.hrv_ms, input.hrv_30d_avg, input.hrv_30d_stddev)
  const sleepComponent = calculateSleepComponent(input.sleep_score, input.sleep_efficiency)
  const loadComponent = calculateLoadComponent(input.atl, input.ctl)
  const trendComponent = calculateTrendComponent(input.recovery_scores_last_3d)

  const score = Math.round(
    hrvComponent * 0.35 +
    sleepComponent * 0.30 +
    loadComponent * 0.25 +
    trendComponent * 0.10,
  )

  // Confidence: how complete is the data?
  const dataPoints = [
    input.hrv_ms !== undefined,
    input.sleep_score !== undefined,
    input.recovery_scores_last_3d !== undefined,
    input.hrv_30d_avg !== undefined,
  ]
  const confidence = dataPoints.filter(Boolean).length / dataPoints.length

  const atl = input.atl
  const ctl = input.ctl
  const tsb = calculateTSB(ctl, atl)

  return {
    date: new Date().toISOString().split('T')[0],
    score,
    hrv_component: hrvComponent,
    sleep_component: sleepComponent,
    load_component: loadComponent,
    recovery_trend_component: trendComponent,
    label: getReadinessLabel(score),
    confidence,
    atl,
    ctl,
    tsb,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize WHOOP Strain (0-21) to TSS-like scale (0-150+).
 * WHOOP Strain 21 ≈ all-out day ≈ 150 TSS
 */
export function normalizeWhoopStrain(strain: number): number {
  return Math.round((strain / 21) * 150 * 10) / 10
}

/**
 * Normalize WHOOP Recovery (0-100%) to our internal 0-100 scale.
 * WHOOP recovery is already 0-100, but their "red/yellow/green" bands differ from ours.
 */
export function normalizeWhoopRecovery(whoopRecovery: number): number {
  return Math.round(whoopRecovery)
}

/**
 * Normalize Strava Suffer Score to TSS-like scale.
 * Strava Suffer Score is relative (1-600+), not on TSS scale.
 * We use a soft normalization: SS 100 ≈ 60-70 TSS.
 */
export function normalizeStravaSufferScore(sufferScore: number): number {
  return Math.round(sufferScore * 0.65)
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}/km`
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`
  return `${Math.round(meters)}m`
}

export function metersPerSecondToPaceSecKm(mps: number): number {
  if (mps <= 0) return 0
  return 1000 / mps
}
