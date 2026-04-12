import type { HRZones, PowerZones, ZoneDistribution } from './types'

// ─── Training Load ────────────────────────────────────────────────────────────

export function calculateTSS(
  durationSeconds: number,
  normalizedPowerWatts: number,
  ftpWatts: number,
): number {
  if (ftpWatts <= 0) return 0
  const IF = normalizedPowerWatts / ftpWatts
  return Math.round(((durationSeconds * normalizedPowerWatts * IF) / (ftpWatts * 3600)) * 100 * 10) / 10
}

export function calculateHRTSS(
  durationSeconds: number,
  avgHR: number,
  restingHR: number,
  maxHR: number,
  gender: string = 'male',
): number {
  if (maxHR <= restingHR) return 0
  const hrr = (avgHR - restingHR) / (maxHR - restingHR)
  const k = gender === 'female' ? 1.67 : 1.92
  const trimp = (durationSeconds / 60) * hrr * 0.64 * Math.exp(k * hrr)
  return Math.round(trimp * 1.1 * 10) / 10
}

function ema(values: number[], timeConstant: number): number[] {
  const k = 2 / (timeConstant + 1)
  const out: number[] = []
  let prev = values[0] ?? 0
  for (const v of values) {
    const curr = v * k + prev * (1 - k)
    out.push(curr)
    prev = curr
  }
  return out
}

export function buildDailyLoadArray(
  sessions: { started_at: string; training_load?: number | null }[],
  days: number,
): number[] {
  const now = new Date()
  const arr = new Array(days).fill(0)
  for (const s of sessions) {
    const daysAgo = Math.floor((now.getTime() - new Date(s.started_at).getTime()) / 86400000)
    const idx = days - 1 - daysAgo
    if (idx >= 0 && idx < days) arr[idx] += s.training_load ?? 0
  }
  return arr
}

export function calculateATL(sessions: { started_at: string; training_load?: number | null }[], days = 7): number {
  const arr = buildDailyLoadArray(sessions, Math.max(days, 42))
  const v = ema(arr, days)
  return Math.round((v[v.length - 1] ?? 0) * 10) / 10
}

export function calculateCTL(sessions: { started_at: string; training_load?: number | null }[], days = 42): number {
  const arr = buildDailyLoadArray(sessions, days)
  const v = ema(arr, days)
  return Math.round((v[v.length - 1] ?? 0) * 10) / 10
}

export function calculateTSB(ctl: number, atl: number): number {
  return Math.round((ctl - atl) * 10) / 10
}

// ─── Zone Calculations ────────────────────────────────────────────────────────

export function calculateHRZones(lthr: number): HRZones {
  return {
    z1: [0,           Math.round(lthr * 0.81)],
    z2: [Math.round(lthr * 0.81 + 1), Math.round(lthr * 0.89)],
    z3: [Math.round(lthr * 0.89 + 1), Math.round(lthr * 0.93)],
    z4: [Math.round(lthr * 0.93 + 1), Math.round(lthr * 1.01)],
    z5: [Math.round(lthr * 1.01 + 1), 999],
  }
}

export function calculatePowerZones(ftp: number): PowerZones {
  return {
    z1: [0,                         Math.round(ftp * 0.55)],
    z2: [Math.round(ftp * 0.55 + 1), Math.round(ftp * 0.74)],
    z3: [Math.round(ftp * 0.75),     Math.round(ftp * 0.89)],
    z4: [Math.round(ftp * 0.90),     Math.round(ftp * 1.04)],
    z5: [Math.round(ftp * 1.05),     Math.round(ftp * 1.20)],
    z6: [Math.round(ftp * 1.20 + 1), 9999],
  }
}

export function getHRZone(hr: number, zones: HRZones): number {
  if (hr <= zones.z1[1]) return 1
  if (hr <= zones.z2[1]) return 2
  if (hr <= zones.z3[1]) return 3
  if (hr <= zones.z4[1]) return 4
  return 5
}

export function getPowerZone(watts: number, zones: PowerZones): number {
  if (watts <= zones.z1[1]) return 1
  if (watts <= zones.z2[1]) return 2
  if (watts <= zones.z3[1]) return 3
  if (watts <= zones.z4[1]) return 4
  if (watts <= zones.z5[1]) return 5
  return 6
}

// ─── Readiness Score ─────────────────────────────────────────────────────────

interface ReadinessInput {
  hrv_ms?: number
  hrv_30d_avg?: number
  hrv_30d_stddev?: number
  sleep_score?: number
  sleep_efficiency?: number
  atl: number
  ctl: number
  recovery_scores_3d?: number[]
}

export function calculateReadinessScore(input: ReadinessInput): {
  score: number
  hrv_component: number
  sleep_component: number
  load_component: number
  trend_component: number
  label: string
  confidence: number
  tsb: number
} {
  const hrv = (() => {
    if (!input.hrv_ms || !input.hrv_30d_avg) return 50
    const std = input.hrv_30d_stddev ?? input.hrv_30d_avg * 0.1
    const z = Math.max(-2, Math.min(2, (input.hrv_ms - input.hrv_30d_avg) / std))
    return Math.round(50 + z * 25)
  })()

  const sleep = (() => {
    const s = input.sleep_score ?? 70
    const e = (input.sleep_efficiency ?? 0.78) * 100
    return Math.round(s * 0.7 + e * 0.3)
  })()

  const tsb = calculateTSB(input.ctl, input.atl)
  const load = (() => {
    if (tsb > 10) return 90
    if (tsb > 0) return 75
    if (tsb > -10) return 60
    if (tsb > -20) return 40
    if (tsb > -30) return 20
    return 5
  })()

  const trend = (() => {
    const s = input.recovery_scores_3d
    if (!s || s.length === 0) return 50
    const avg = s.reduce((a, b) => a + b, 0) / s.length
    const delta = s[s.length - 1] - avg
    return Math.round(Math.max(0, Math.min(100, avg + delta * 0.5)))
  })()

  const score = Math.round(hrv * 0.35 + sleep * 0.30 + load * 0.25 + trend * 0.10)
  const label = score >= 80 ? 'optimal' : score >= 65 ? 'good' : score >= 45 ? 'moderate' : score >= 25 ? 'poor' : 'rest_day'

  const pts = [input.hrv_ms, input.sleep_score, input.hrv_30d_avg, input.recovery_scores_3d]
  const confidence = pts.filter(Boolean).length / pts.length

  return { score, hrv_component: hrv, sleep_component: sleep, load_component: load, trend_component: trend, label, confidence, tsb }
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}min`
}

export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return '—'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function formatWattsPerKg(watts?: number | null, weightKg?: number | null): string {
  if (!watts || !weightKg || weightKg <= 0) return '—'
  return `${(watts / weightKg).toFixed(2)} W/kg`
}

export function secKmToMps(secPerKm: number): number {
  return secPerKm > 0 ? 1000 / secPerKm : 0
}

export function mpsToSecKm(mps: number): number {
  return mps > 0 ? 1000 / mps : 0
}

// ─── Provider normalization ───────────────────────────────────────────────────

export function normalizeWhoopStrain(strain: number): number {
  return Math.round((strain / 21) * 150 * 10) / 10
}

export function normalizeWhoopRecovery(pct: number): number {
  return Math.round(pct)
}

export function normalizeStravaSufferScore(ss: number): number {
  return Math.round(ss * 0.65)
}
