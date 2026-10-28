/**
 * Health Engine — WHOOP-style scoring
 * Sources: Fitbit (sleep/HRV/SpO2/resting HR), Strava (load/activities), Suunto (HR streams)
 *
 * References:
 * - HRV4Training (2019): rMSSD as readiness marker
 * - Plews et al. (2013): HRV-guided training
 * - Fullagar et al. (2015): sleep and athlete recovery
 * - Banister (1991): ATL/CTL/TSB impulse-response model
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FitbitSleepStage {
  dateTime: string   // "2026-10-27"
  duration_min: number
  deep_min: number
  rem_min: number
  light_min: number
  awake_min: number
  score?: number           // Fitbit sleep score 0-100
  hrv_rmssd?: number       // avg overnight RMSSD ms
  spo2_avg?: number        // avg SpO2 %
  resting_hr?: number      // BPM on waking
  breath_rate?: number     // breaths/min
}

export interface StravaActivity {
  date: string             // "2026-10-27"
  name: string
  type: string             // "Ride" | "Run" | "Swim" | ...
  distance_m: number
  moving_time_s: number
  tss?: number             // Training Stress Score (if power/pace available)
  avg_hr?: number
  max_hr?: number
  avg_watts?: number
  normalized_watts?: number
  suffer_score?: number    // Strava relative effort
  elevation_m?: number
}

export interface SuuntoActivity {
  date: string
  name: string
  sport: string
  duration_s: number
  avg_hr?: number
  max_hr?: number
  training_effect?: number // 1-5 Suunto aerobic TE
  recovery_time_h?: number // Suunto predicted recovery hours
}

export interface DayHealth {
  date: string
  // Recovery components (0-100 each)
  recovery_score: number        // composite WHOOP-style
  hrv_score: number
  sleep_score: number
  resting_hr_score: number
  spo2_score: number
  // Training load
  atl: number                   // Acute Training Load (7-day)
  ctl: number                   // Chronic Training Load (42-day)
  tsb: number                   // Training Stress Balance
  daily_tss: number
  // Raw values
  hrv_rmssd?: number
  sleep_duration_min?: number
  sleep_deep_min?: number
  sleep_rem_min?: number
  resting_hr?: number
  spo2?: number
  breath_rate?: number
  // Status
  recovery_label: 'optimal' | 'good' | 'moderate' | 'poor' | 'rest'
  training_recommendation: string
  // Source flags
  has_fitbit: boolean
  has_strava: boolean
  has_suunto: boolean
}

export interface HealthTrend {
  days: DayHealth[]
  weekly_avg_recovery: number
  weekly_avg_hrv: number
  weekly_avg_sleep_min: number
  hrv_trend: 'rising' | 'stable' | 'declining'
  sleep_debt_min: number        // cumulative deficit vs 8h target
  atl_ctl_ratio: number
  overtraining_risk: 'low' | 'moderate' | 'high'
  streak_good_recovery: number  // consecutive days ≥70
}

// ─── Scoring functions ────────────────────────────────────────────────────────

/** HRV score: personal baseline ± deviation */
export function scoreHRV(rmssd: number | undefined, baseline: number = 55): number {
  if (!rmssd) return 50
  // WHOOP uses a rolling 30-day baseline. Here we use a provided or default baseline.
  const ratio = rmssd / baseline
  if (ratio >= 1.15) return 95
  if (ratio >= 1.05) return 85
  if (ratio >= 0.95) return 72
  if (ratio >= 0.85) return 55
  if (ratio >= 0.75) return 38
  return 22
}

/** Sleep score: duration + quality (deep+REM ratio) */
export function scoreSleep(
  duration_min: number | undefined,
  deep_min: number | undefined = 0,
  rem_min: number | undefined = 0,
  fitbit_score: number | undefined
): number {
  if (fitbit_score) return fitbit_score   // trust Fitbit's own score if available

  if (!duration_min) return 45
  const duration_score = Math.min(100, (duration_min / 480) * 100) // 8h = 100
  const total = duration_min
  const quality_ratio = total > 0 ? (deep_min + rem_min) / total : 0
  const quality_score = Math.min(100, quality_ratio * 250) // 40% deep+REM = 100
  return Math.round(duration_score * 0.6 + quality_score * 0.4)
}

/** Resting HR score: lower is better, personal baseline */
export function scoreRestingHR(rhr: number | undefined, baseline: number = 52): number {
  if (!rhr) return 60
  const delta = rhr - baseline
  if (delta <= -3) return 92
  if (delta <= 0)  return 80
  if (delta <= 3)  return 65
  if (delta <= 6)  return 45
  if (delta <= 10) return 28
  return 15
}

/** SpO2 score */
export function scoreSpO2(spo2: number | undefined): number {
  if (!spo2) return 75
  if (spo2 >= 97) return 100
  if (spo2 >= 95) return 85
  if (spo2 >= 93) return 60
  if (spo2 >= 90) return 35
  return 15
}

/** Composite recovery score — weights match WHOOP methodology approximately */
export function calcRecoveryScore(
  hrv: number,
  sleep: number,
  rhr: number,
  spo2: number,
  tsb: number
): number {
  // Load modifier: very negative TSB penalises recovery
  const load_modifier = tsb > 10 ? 1.04 : tsb > -10 ? 1.0 : tsb > -25 ? 0.92 : 0.82
  const raw = hrv * 0.35 + sleep * 0.30 + rhr * 0.20 + spo2 * 0.15
  return Math.round(Math.min(100, Math.max(0, raw * load_modifier)))
}

function recoveryLabel(score: number): DayHealth['recovery_label'] {
  if (score >= 85) return 'optimal'
  if (score >= 70) return 'good'
  if (score >= 50) return 'moderate'
  if (score >= 30) return 'poor'
  return 'rest'
}

function trainingRec(score: number, tsb: number): string {
  if (score >= 85 && tsb > -10) return 'Green light — high-intensity or long session'
  if (score >= 70) return 'Good to train — moderate to hard effort'
  if (score >= 50) return 'Train easy — Zone 1–2 only'
  if (score >= 30) return 'Active recovery or rest day'
  return 'Rest — your body needs it'
}

// ─── ATL / CTL / TSB ─────────────────────────────────────────────────────────

export function calcTrainingLoad(activities: StravaActivity[]): {
  byDate: Record<string, number>
  atl: number; ctl: number; tsb: number
} {
  const byDate: Record<string, number> = {}

  for (const a of activities) {
    const tss = a.tss ?? estimateTSS(a)
    byDate[a.date] = (byDate[a.date] ?? 0) + tss
  }

  // Sort dates
  const sorted = Object.keys(byDate).sort()
  let atl = 0, ctl = 0
  const k_atl = 1 - Math.exp(-1 / 7)
  const k_ctl = 1 - Math.exp(-1 / 42)

  for (const d of sorted) {
    const tss = byDate[d] ?? 0
    atl = atl + k_atl * (tss - atl)
    ctl = ctl + k_ctl * (tss - ctl)
  }

  return { byDate, atl: Math.round(atl), ctl: Math.round(ctl), tsb: Math.round(ctl - atl) }
}

/** Rough TSS estimate when no power/pace data */
function estimateTSS(a: StravaActivity): number {
  const hours = a.moving_time_s / 3600
  if (a.suffer_score) return a.suffer_score * 1.5
  if (a.avg_hr) {
    // HR-based estimate: assuming avg HR ~75% of max → ~0.75 IF → TSS ≈ hours × 56
    return Math.round(hours * 56)
  }
  return Math.round(hours * 40) // fallback
}

// ─── Main aggregation ─────────────────────────────────────────────────────────

export function buildHealthTimeline(
  sleepData: FitbitSleepStage[],
  stravaActivities: StravaActivity[],
  suuntoActivities: SuuntoActivity[],
  hrvBaseline = 55,
  rhrBaseline = 52
): HealthTrend {
  const { byDate: tssByDate, atl, ctl, tsb } = calcTrainingLoad(stravaActivities)

  // Also factor in Suunto recovery time as load signal
  const suuntoByDate: Record<string, SuuntoActivity[]> = {}
  for (const s of suuntoActivities) {
    if (!suuntoByDate[s.date]) suuntoByDate[s.date] = []
    suuntoByDate[s.date].push(s)
  }

  const stravaDates = new Set(stravaActivities.map(a => a.date))
  const suuntoDates = new Set(suuntoActivities.map(a => a.date))

  const days: DayHealth[] = sleepData.map(sleep => {
    const hrv_s  = scoreHRV(sleep.hrv_rmssd, hrvBaseline)
    const slp_s  = scoreSleep(sleep.duration_min, sleep.deep_min, sleep.rem_min, sleep.score)
    const rhr_s  = scoreRestingHR(sleep.resting_hr, rhrBaseline)
    const spo2_s = scoreSpO2(sleep.spo2_avg)

    // TSB for this date: reuse the final value (simplified — ideally recalculate per-day)
    const daily_tss = tssByDate[sleep.dateTime] ?? 0
    const recovery = calcRecoveryScore(hrv_s, slp_s, rhr_s, spo2_s, tsb)

    return {
      date: sleep.dateTime,
      recovery_score: recovery,
      hrv_score: hrv_s,
      sleep_score: slp_s,
      resting_hr_score: rhr_s,
      spo2_score: spo2_s,
      atl, ctl, tsb,
      daily_tss,
      hrv_rmssd: sleep.hrv_rmssd,
      sleep_duration_min: sleep.duration_min,
      sleep_deep_min: sleep.deep_min,
      sleep_rem_min: sleep.rem_min,
      resting_hr: sleep.resting_hr,
      spo2: sleep.spo2_avg,
      breath_rate: sleep.breath_rate,
      recovery_label: recoveryLabel(recovery),
      training_recommendation: trainingRec(recovery, tsb),
      has_fitbit: true,
      has_strava: stravaDates.has(sleep.dateTime),
      has_suunto: suuntoDates.has(sleep.dateTime),
    }
  })

  // Trend analytics
  const recent7 = days.slice(-7)
  const weekly_avg_recovery = avg(recent7.map(d => d.recovery_score))
  const weekly_avg_hrv = avg(recent7.filter(d => d.hrv_rmssd).map(d => d.hrv_rmssd!))
  const weekly_avg_sleep_min = avg(recent7.filter(d => d.sleep_duration_min).map(d => d.sleep_duration_min!))

  // HRV trend: compare last 3 vs previous 4
  const hrv_last3 = avg(recent7.slice(-3).filter(d => d.hrv_rmssd).map(d => d.hrv_rmssd!))
  const hrv_prev4 = avg(recent7.slice(0, 4).filter(d => d.hrv_rmssd).map(d => d.hrv_rmssd!))
  const hrv_trend: HealthTrend['hrv_trend'] =
    hrv_last3 > hrv_prev4 * 1.03 ? 'rising' :
    hrv_last3 < hrv_prev4 * 0.97 ? 'declining' : 'stable'

  const sleep_debt_min = recent7.reduce((acc, d) => acc + (480 - (d.sleep_duration_min ?? 480)), 0)
  const atl_ctl_ratio = ctl > 0 ? atl / ctl : 1

  const overtraining_risk: HealthTrend['overtraining_risk'] =
    atl_ctl_ratio > 1.5 || tsb < -30 ? 'high' :
    atl_ctl_ratio > 1.25 || tsb < -15 ? 'moderate' : 'low'

  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].recovery_score >= 70) streak++
    else break
  }

  return {
    days,
    weekly_avg_recovery: Math.round(weekly_avg_recovery),
    weekly_avg_hrv: Math.round(weekly_avg_hrv * 10) / 10,
    weekly_avg_sleep_min: Math.round(weekly_avg_sleep_min),
    hrv_trend,
    sleep_debt_min: Math.max(0, sleep_debt_min),
    atl_ctl_ratio: Math.round(atl_ctl_ratio * 100) / 100,
    overtraining_risk,
    streak_good_recovery: streak,
  }
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

// ─── Mock data for demo ───────────────────────────────────────────────────────

export function getMockHealthData(): {
  sleep: FitbitSleepStage[]
  strava: StravaActivity[]
  suunto: SuuntoActivity[]
} {
  const today = new Date()
  const dateStr = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    return d.toISOString().split('T')[0]
  }

  const sleep: FitbitSleepStage[] = [
    { dateTime: dateStr(13), duration_min: 412, deep_min: 68, rem_min: 94, light_min: 210, awake_min: 40, hrv_rmssd: 51, spo2_avg: 96.2, resting_hr: 54, breath_rate: 14.1, score: 72 },
    { dateTime: dateStr(12), duration_min: 445, deep_min: 82, rem_min: 108, light_min: 215, awake_min: 40, hrv_rmssd: 58, spo2_avg: 97.1, resting_hr: 51, breath_rate: 13.8, score: 81 },
    { dateTime: dateStr(11), duration_min: 390, deep_min: 55, rem_min: 88, light_min: 207, awake_min: 40, hrv_rmssd: 44, spo2_avg: 95.8, resting_hr: 57, breath_rate: 14.6, score: 63 },
    { dateTime: dateStr(10), duration_min: 460, deep_min: 90, rem_min: 115, light_min: 215, awake_min: 40, hrv_rmssd: 63, spo2_avg: 97.4, resting_hr: 50, breath_rate: 13.5, score: 87 },
    { dateTime: dateStr(9),  duration_min: 430, deep_min: 75, rem_min: 100, light_min: 215, awake_min: 40, hrv_rmssd: 59, spo2_avg: 97.0, resting_hr: 52, breath_rate: 13.9, score: 80 },
    { dateTime: dateStr(8),  duration_min: 380, deep_min: 50, rem_min: 82, light_min: 208, awake_min: 40, hrv_rmssd: 42, spo2_avg: 95.5, resting_hr: 58, breath_rate: 14.8, score: 60 },
    { dateTime: dateStr(7),  duration_min: 470, deep_min: 95, rem_min: 118, light_min: 217, awake_min: 40, hrv_rmssd: 67, spo2_avg: 97.6, resting_hr: 49, breath_rate: 13.3, score: 90 },
    { dateTime: dateStr(6),  duration_min: 440, deep_min: 80, rem_min: 105, light_min: 215, awake_min: 40, hrv_rmssd: 60, spo2_avg: 97.2, resting_hr: 51, breath_rate: 13.7, score: 82 },
    { dateTime: dateStr(5),  duration_min: 415, deep_min: 70, rem_min: 96, light_min: 209, awake_min: 40, hrv_rmssd: 54, spo2_avg: 96.8, resting_hr: 53, breath_rate: 14.0, score: 75 },
    { dateTime: dateStr(4),  duration_min: 395, deep_min: 58, rem_min: 90, light_min: 207, awake_min: 40, hrv_rmssd: 48, spo2_avg: 96.1, resting_hr: 55, breath_rate: 14.3, score: 68 },
    { dateTime: dateStr(3),  duration_min: 455, deep_min: 88, rem_min: 112, light_min: 215, awake_min: 40, hrv_rmssd: 64, spo2_avg: 97.3, resting_hr: 50, breath_rate: 13.6, score: 85 },
    { dateTime: dateStr(2),  duration_min: 448, deep_min: 85, rem_min: 110, light_min: 213, awake_min: 40, hrv_rmssd: 62, spo2_avg: 97.2, resting_hr: 51, breath_rate: 13.7, score: 83 },
    { dateTime: dateStr(1),  duration_min: 465, deep_min: 92, rem_min: 116, light_min: 217, awake_min: 40, hrv_rmssd: 66, spo2_avg: 97.5, resting_hr: 50, breath_rate: 13.4, score: 88 },
    { dateTime: dateStr(0),  duration_min: 458, deep_min: 89, rem_min: 113, light_min: 216, awake_min: 40, hrv_rmssd: 65, spo2_avg: 97.4, resting_hr: 50, breath_rate: 13.5, score: 87 },
  ]

  const strava: StravaActivity[] = [
    { date: dateStr(12), name: 'Morning Ride',   type: 'Ride', distance_m: 42000, moving_time_s: 5400, tss: 88, avg_hr: 148, avg_watts: 210, normalized_watts: 225 },
    { date: dateStr(10), name: 'Interval Run',   type: 'Run',  distance_m: 10200, moving_time_s: 2700, tss: 72, avg_hr: 162 },
    { date: dateStr(8),  name: 'Long Ride',      type: 'Ride', distance_m: 85000, moving_time_s: 10800, tss: 145, avg_hr: 141, avg_watts: 195, normalized_watts: 218 },
    { date: dateStr(6),  name: 'Easy Run',       type: 'Run',  distance_m: 8500,  moving_time_s: 2700, tss: 40, avg_hr: 138 },
    { date: dateStr(4),  name: 'Threshold Ride', type: 'Ride', distance_m: 35000, moving_time_s: 4200, tss: 95, avg_hr: 155, avg_watts: 235, normalized_watts: 248 },
    { date: dateStr(2),  name: 'Brick Session',  type: 'Ride', distance_m: 28000, moving_time_s: 3600, tss: 78, avg_hr: 150, avg_watts: 215 },
    { date: dateStr(1),  name: 'Tempo Run',      type: 'Run',  distance_m: 12000, moving_time_s: 3300, tss: 68, avg_hr: 158 },
  ]

  const suunto: SuuntoActivity[] = [
    { date: dateStr(11), name: 'Pool Swim', sport: 'Swimming', duration_s: 3600, avg_hr: 135, training_effect: 3.2, recovery_time_h: 16 },
    { date: dateStr(7),  name: 'Open Water', sport: 'Swimming', duration_s: 2700, avg_hr: 142, training_effect: 3.8, recovery_time_h: 20 },
    { date: dateStr(3),  name: 'Strength',   sport: 'Gym',     duration_s: 3900, avg_hr: 128, training_effect: 2.5, recovery_time_h: 24 },
  ]

  return { sleep, strava, suunto }
}
