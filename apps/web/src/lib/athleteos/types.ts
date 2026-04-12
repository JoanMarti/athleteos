// ============================================================
// AthleteOS — Shared Domain Types
// ============================================================

// ─── Providers ───────────────────────────────────────────────
export type Provider =
  | 'strava'
  | 'garmin'
  | 'suunto'
  | 'wahoo'
  | 'whoop'
  | 'intervals'
  | 'trainingpeaks'
  | 'polar'
  | 'coros'

export const PROVIDER_META: Record<Provider, {
  label: string
  color: string
  authType: 'oauth2' | 'apikey' | 'oauth1'
  supportsActivity: boolean
  supportsRecovery: boolean
  supportsHRV: boolean
  requiresApproval: boolean
  status: 'available' | 'beta' | 'coming_soon'
}> = {
  strava:        { label: 'Strava',         color: '#FC4C02', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: false, status: 'available' },
  garmin:        { label: 'Garmin Connect', color: '#007CC3', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: true,  supportsHRV: true,  requiresApproval: true,  status: 'available' },
  suunto:        { label: 'Suunto',         color: '#E02020', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: false, status: 'available' },
  wahoo:         { label: 'Wahoo',          color: '#E31837', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: false, status: 'available' },
  whoop:         { label: 'WHOOP',          color: '#00ff87', authType: 'oauth2',  supportsActivity: false, supportsRecovery: true,  supportsHRV: true,  requiresApproval: true,  status: 'available' },
  intervals:     { label: 'Intervals.icu',  color: '#7B2D8B', authType: 'apikey',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: false, status: 'available' },
  trainingpeaks: { label: 'TrainingPeaks',  color: '#0F6DB5', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: true,  status: 'beta' },
  polar:         { label: 'Polar',          color: '#D30C2E', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: true,  supportsHRV: true,  requiresApproval: false, status: 'coming_soon' },
  coros:         { label: 'COROS',          color: '#1A73E8', authType: 'oauth2',  supportsActivity: true,  supportsRecovery: false, supportsHRV: false, requiresApproval: true,  status: 'coming_soon' },
}

// ─── Sport Types ─────────────────────────────────────────────
export type SportType = 'cycling' | 'running' | 'swimming' | 'strength' | 'triathlon' | 'hiking' | 'rowing' | 'other'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type GoalType = 'ftp_improvement' | 'race_preparation' | 'weight_loss' | 'endurance_base' | 'vo2max' | 'time_goal' | 'general_fitness'
export type ReadinessLabel = 'optimal' | 'good' | 'moderate' | 'poor' | 'rest_day'
export type SessionType = 'key_session' | 'easy' | 'recovery' | 'rest' | 'strength' | 'race'
export type InsightSeverity = 'info' | 'warning' | 'alert'

// ─── User & Profile ───────────────────────────────────────────
export interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  country: string | null
  timezone: string
  locale: string
  onboarding_done: boolean
  created_at: string
}

export interface HRZones {
  z1: [number, number]
  z2: [number, number]
  z3: [number, number]
  z4: [number, number]
  z5: [number, number]
}

export interface PowerZones {
  z1: [number, number]  // Active Recovery: <55% FTP
  z2: [number, number]  // Endurance:       55-74%
  z3: [number, number]  // Tempo:           75-89%
  z4: [number, number]  // Threshold:       90-104%
  z5: [number, number]  // VO2max:          105-120%
  z6: [number, number]  // Anaerobic:       >120%
}

export interface AthleteProfile {
  id: string
  user_id: string
  primary_sport: SportType
  secondary_sports: SportType[]
  experience_level: ExperienceLevel
  gender?: string
  date_of_birth?: string
  weight_kg?: number
  height_cm?: number
  // Cycling
  ftp_watts?: number
  ftp_updated_at?: string
  w_prime_joules?: number
  max_aerobic_power_watts?: number
  // Running
  lthr_bpm?: number
  threshold_pace_sec_km?: number
  run_vo2max_estimate?: number
  // HR
  max_hr_bpm?: number
  resting_hr_bpm?: number
  // Zones
  hr_zones?: HRZones
  power_zones?: PowerZones
  pace_zones?: Record<string, [number, number]>
  // Targets
  weekly_training_hours_target: number
  weekly_tss_target?: number
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  type: GoalType
  title: string
  description?: string
  target_metric?: string
  target_value?: number
  target_unit?: string
  baseline_value?: number
  current_value?: number
  target_date?: string
  is_primary: boolean
  status: 'active' | 'achieved' | 'abandoned' | 'paused'
  created_at: string
}

// ─── Connected Integrations ───────────────────────────────────
export interface ConnectedIntegration {
  id: string
  user_id: string
  provider: Provider
  provider_user_id?: string
  provider_username?: string
  provider_display_name?: string
  provider_avatar_url?: string
  scopes: string[]
  is_active: boolean
  is_primary: boolean
  last_sync_at?: string
  last_sync_status: 'pending' | 'syncing' | 'success' | 'error' | 'rate_limited'
  last_sync_error?: string
  total_activities_synced: number
  provider_metadata: Record<string, unknown>
  created_at: string
}

// ─── Training Session ─────────────────────────────────────────
export interface ZoneDistribution {
  z1: number; z2: number; z3: number; z4: number; z5: number
}

export interface TrainingSession {
  id: string
  user_id: string
  source_provider: Provider
  external_id?: string
  external_url?: string
  sport_type: SportType
  title?: string
  description?: string
  started_at: string
  ended_at?: string
  duration_seconds: number
  moving_time_seconds?: number
  distance_meters?: number
  elevation_gain_meters?: number
  // Power
  average_power_watts?: number
  normalized_power_watts?: number
  max_power_watts?: number
  intensity_factor?: number
  // HR
  average_hr_bpm?: number
  max_hr_bpm?: number
  // Running
  average_pace_sec_km?: number
  average_cadence_rpm?: number
  // Load
  training_load?: number
  training_stress_score?: number
  // Energy
  calories_estimated?: number
  kilojoules?: number
  // Zones
  hr_zone_distribution?: ZoneDistribution
  power_zone_distribution?: ZoneDistribution
  // Flags
  is_race: boolean
  is_manual: boolean
  is_trainer: boolean
  created_at: string
}

// ─── Recovery & Sleep ─────────────────────────────────────────
export interface RecoveryData {
  id: string
  user_id: string
  source_provider: Provider
  date: string
  recovery_score?: number
  readiness_score?: number
  hrv_rmssd_ms?: number
  hrv_sdnn_ms?: number
  resting_hr_bpm?: number
  blood_oxygen_pct?: number
  respiratory_rate?: number
  skin_temp_celsius?: number
  body_battery_end?: number
  provider_score?: number
  provider_label?: string
  created_at: string
}

export interface SleepData {
  id: string
  user_id: string
  source_provider: Provider
  date: string
  sleep_start?: string
  sleep_end?: string
  total_sleep_minutes?: number
  total_in_bed_minutes?: number
  awake_minutes?: number
  light_sleep_minutes?: number
  deep_sleep_minutes?: number
  rem_sleep_minutes?: number
  sleep_score?: number
  sleep_efficiency?: number
  sleep_consistency?: number
  disturbance_count?: number
  created_at: string
}

// ─── Calculated Metrics ───────────────────────────────────────
export interface DailyMetrics {
  id: string
  user_id: string
  date: string
  atl: number
  ctl: number
  tsb: number
  daily_tss: number
  readiness_score: number
  readiness_label: ReadinessLabel
  readiness_confidence: number
  hrv_component: number
  sleep_component: number
  load_component: number
  trend_component: number
  weekly_tss_to_date: number
  consecutive_hard_days: number
  calculated_at: string
}

// ─── Recommendations ──────────────────────────────────────────
export interface WorkoutInterval {
  type: 'warmup' | 'interval' | 'rest' | 'cooldown' | 'steady'
  duration_seconds: number
  target_power_pct_ftp?: number
  target_hr_zone?: string
  description?: string
}

export interface DailyRecommendation {
  id: string
  user_id: string
  date: string
  session_type: SessionType
  sport?: SportType | 'rest'
  title?: string
  description?: string
  duration_target_min?: number
  intensity_zone?: string
  tss_target?: number
  workout_structure?: { warmup?: WorkoutInterval; main: WorkoutInterval[]; cooldown?: WorkoutInterval }
  status: 'pending' | 'done' | 'skipped' | 'modified'
  reason?: string
  rule_id?: string
  confidence?: number
  actual_session_id?: string
  created_at: string
}

export interface Insight {
  id: string
  user_id: string
  type: string
  title?: string
  body?: string
  severity: InsightSeverity
  action?: string
  data_points?: Record<string, unknown>
  is_read: boolean
  generated_at: string
}

// ─── Dashboard Aggregations ───────────────────────────────────
export interface TodayDashboard {
  metrics: DailyMetrics | null
  recommendation: DailyRecommendation | null
  last_activity: TrainingSession | null
  recovery: RecoveryData | null
  sleep: SleepData | null
  insights: Insight[]
  weekly_summary: {
    tss_actual: number
    tss_planned: number
    sessions_done: number
    sessions_planned: number
    hours_done: number
  }
}

export interface WeeklyDashboard {
  load_by_day: Array<{ date: string; planned: number; actual: number; label: string }>
  sessions: TrainingSession[]
  metrics_by_day: DailyMetrics[]
  sport_breakdown: Array<{ sport: SportType; duration_seconds: number; tss: number; distance_km: number }>
  totals: { tss: number; hours: number; distance_km: number; elevation_m: number }
}

// ─── API DTOs ─────────────────────────────────────────────────
export interface UpdateAthleteProfileDto {
  primary_sport?: SportType
  secondary_sports?: SportType[]
  experience_level?: ExperienceLevel
  weight_kg?: number
  height_cm?: number
  ftp_watts?: number
  lthr_bpm?: number
  max_hr_bpm?: number
  resting_hr_bpm?: number
  weekly_training_hours_target?: number
}

export interface ConnectIntegrationDto {
  provider: Provider
  code?: string      // OAuth code
  api_key?: string   // For API-key providers
  state?: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}
