// ─────────────────────────────────────────────────────────────────────────────
// AthleteOS — Shared Domain Types
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Provider = 'strava' | 'whoop' | 'garmin' | 'suunto'

export type SportType =
  | 'cycling'
  | 'running'
  | 'swimming'
  | 'strength'
  | 'triathlon'
  | 'other'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type GoalType =
  | 'ftp_improvement'
  | 'race_preparation'
  | 'weight_loss'
  | 'endurance_base'
  | 'vo2max'
  | 'time_goal'
  | 'general_fitness'

export type PeriodizationPhase = 'base' | 'build' | 'peak' | 'recovery' | 'taper'

export type SessionType = 'key_session' | 'easy' | 'recovery' | 'rest' | 'strength' | 'race'

export type IntensityZone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5'

export type ReadinessLabel = 'optimal' | 'good' | 'moderate' | 'poor' | 'rest_day'

export type InsightType =
  | 'performance_drop'
  | 'performance_gain'
  | 'zone_inefficiency'
  | 'overtraining_risk'
  | 'recovery_deficit'
  | 'consistency_issue'
  | 'pr_detected'
  | 'training_milestone'

export type InsightSeverity = 'info' | 'warning' | 'alert'

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'error'

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  timezone: string
  locale: string
  created_at: string
  updated_at: string
}

export interface HRZones {
  z1: [number, number]
  z2: [number, number]
  z3: [number, number]
  z4: [number, number]
  z5: [number, number]
}

export interface PowerZones {
  z1: [number, number] // Active Recovery: <55% FTP
  z2: [number, number] // Endurance: 55-74%
  z3: [number, number] // Tempo: 75-89%
  z4: [number, number] // Threshold: 90-104%
  z5: [number, number] // VO2max: 105-120%
  z6: [number, number] // Anaerobic: >120%
}

export interface AthleteProfile {
  id: string
  user_id: string
  display_name: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not'
  weight_kg?: number
  height_cm?: number
  primary_sport: SportType
  secondary_sports: SportType[]
  experience_level: ExperienceLevel
  weekly_training_hours_target: number
  ftp_watts?: number        // Functional Threshold Power (cycling)
  lthr_bpm?: number         // Lactate Threshold Heart Rate
  vo2max_estimate?: number
  max_hr?: number
  hr_zones?: HRZones
  power_zones?: PowerZones
  updated_at: string
}

export interface ConnectedAccount {
  id: string
  user_id: string
  provider: Provider
  provider_user_id: string
  is_active: boolean
  scopes: string[]
  last_sync_at?: string
  sync_status: SyncStatus
  error_message?: string
  created_at: string
  // Note: tokens are NEVER exposed to frontend
}

export interface ZoneDistribution {
  z1: number // 0-1 fraction of time
  z2: number
  z3: number
  z4: number
  z5: number
}

export interface TrainingSession {
  id: string
  user_id: string
  source: Provider | 'manual'
  external_id?: string
  sport_type: SportType
  title: string
  started_at: string
  duration_seconds: number
  distance_meters?: number
  elevation_gain_meters?: number

  // Effort metrics
  training_load?: number        // Normalized TSS
  intensity_factor?: number     // IF 0-1
  normalized_power_watts?: number
  average_power_watts?: number
  average_hr_bpm?: number
  max_hr_bpm?: number
  average_pace_sec_km?: number
  average_cadence_rpm?: number
  calories_estimated?: number

  // Zone distributions
  hr_zone_distribution?: ZoneDistribution
  power_zone_distribution?: ZoneDistribution

  created_at: string
}

export interface SleepMetrics {
  id: string
  user_id: string
  date: string
  total_duration_minutes: number
  light_sleep_minutes: number
  deep_sleep_minutes: number
  rem_sleep_minutes: number
  awake_minutes: number
  sleep_efficiency: number      // 0-1
  sleep_score?: number          // 0-100 normalized
  sleep_consistency?: number    // vs. habitual bedtime
  source: Provider
}

export interface RecoverySession {
  id: string
  user_id: string
  source: Provider
  external_id?: string
  date: string
  recovery_score?: number       // 0-100 normalized
  hrv_ms?: number               // RMSSD in ms
  resting_hr_bpm?: number
  respiratory_rate?: number
  body_battery?: number         // Garmin specific, normalized
  sleep_metrics?: SleepMetrics
  created_at: string
}

export interface ReadinessScore {
  id: string
  user_id: string
  date: string
  score: number                 // 0-100

  // Components
  hrv_component: number
  sleep_component: number
  load_component: number
  recovery_trend_component: number

  label: ReadinessLabel
  confidence: number            // 0-1, based on data completeness

  // Training load metrics
  training_load_7d: number      // ATL
  training_load_28d: number
  atl: number                   // Acute Training Load
  ctl: number                   // Chronic Training Load
  tsb: number                   // Training Stress Balance

  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  type: GoalType
  target_metric: string
  target_value: number
  target_unit: string
  baseline_value?: number
  current_value?: number
  target_date?: string
  is_primary: boolean
  status: 'active' | 'achieved' | 'abandoned'
  created_at: string
}

export interface WorkoutInterval {
  type: 'warmup' | 'interval' | 'rest' | 'cooldown' | 'steady'
  duration_seconds: number
  target_power_pct_ftp?: number  // e.g. 0.95 = 95% FTP
  target_hr_zone?: IntensityZone
  target_pace_sec_km?: number
  description?: string
}

export interface WorkoutStructure {
  warmup?: WorkoutInterval
  main: WorkoutInterval[]
  cooldown?: WorkoutInterval
}

export interface DailyRecommendation {
  id: string
  user_id: string
  weekly_plan_id?: string
  date: string
  type: SessionType
  sport: SportType | 'rest'
  title: string
  description: string
  duration_target_minutes?: number
  intensity_target?: IntensityZone
  load_target?: number
  workout_structure?: WorkoutStructure
  status: 'pending' | 'done' | 'skipped' | 'modified'
  actual_session_id?: string

  // Recommendation engine metadata
  reason: string
  confidence: number
  rule_ids: string[]

  created_at: string
}

export interface WeeklyPlan {
  id: string
  user_id: string
  goal_id?: string
  week_start_date: string
  status: 'draft' | 'active' | 'completed' | 'modified'
  planned_load: number
  target_hours: number
  periodization_phase: PeriodizationPhase
  notes?: string
  daily_recommendations: DailyRecommendation[]
  created_at: string
  updated_at: string
}

export interface NutritionRecommendation {
  id: string
  user_id: string
  date: string
  training_load_today: number
  calories_base: number
  calories_training: number
  calories_total_estimate: number
  carbs_g: number
  protein_g: number
  fat_g: number
  water_ml: number
  electrolytes_recommended: boolean
  timing_suggestions?: {
    pre_training?: string
    intra_training?: string
    post_training?: string
  }
  notes?: string
  disclaimer: string
  created_at: string
}

export interface ImprovementInsight {
  id: string
  user_id: string
  generated_at: string
  insight_type: InsightType
  metric?: string
  title: string
  body: string
  severity: InsightSeverity
  action_suggested?: string
  data_points?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ─── Provider Raw Types ───────────────────────────────────────────────────────

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  elapsed_time: number
  moving_time: number
  distance: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  max_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  average_cadence?: number
  suffer_score?: number
  trainer: boolean
  commute: boolean
  manual: boolean
}

export interface StravaActivityStream {
  time: { data: number[] }
  heartrate?: { data: number[] }
  watts?: { data: number[] }
  cadence?: { data: number[] }
  velocity_smooth?: { data: number[] }
  altitude?: { data: number[] }
  latlng?: { data: [number, number][] }
}

export interface WhoopRecovery {
  cycle_id: number
  sleep_id: number
  user_id: number
  created_at: string
  updated_at: string
  score_state: string
  score?: {
    user_calibrating: boolean
    recovery_score: number      // 0-100
    resting_heart_rate: number
    hrv_rmssd_milli: number
    spo2_percentage: number
    skin_temp_celsius: number
  }
}

export interface WhoopSleepStage {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string
  timezone_offset: string
  naps: unknown[]
  score_state: string
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number
      total_awake_time_milli: number
      total_no_data_time_milli: number
      total_light_sleep_time_milli: number
      total_slow_wave_sleep_time_milli: number
      total_rem_sleep_time_milli: number
      sleep_cycle_count: number
      disturbance_count: number
    }
    sleep_needed: {
      baseline_milli: number
      need_from_sleep_debt_milli: number
      need_from_recent_strain_milli: number
      need_from_recent_nap_milli: number
    }
    respiratory_rate: number
    sleep_performance_percentage: number
    sleep_consistency_percentage: number
    sleep_efficiency_percentage: number
  }
}

export interface WhoopWorkout {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string
  timezone_offset: string
  sport_id: number
  score_state: string
  score?: {
    strain: number            // 0-21
    average_heart_rate: number
    max_heart_rate: number
    kilojoule: number
    percent_recorded: number
    distance_meter: number
    altitude_gain_meter: number
    altitude_change_meter: number
    zone_duration: {
      zone_zero_milli: number
      zone_one_milli: number
      zone_two_milli: number
      zone_three_milli: number
      zone_four_milli: number
      zone_five_milli: number
    }
  }
}

// ─── API Request / Response DTOs ─────────────────────────────────────────────

export interface UpdateAthleteProfileDto {
  display_name?: string
  weight_kg?: number
  height_cm?: number
  primary_sport?: SportType
  secondary_sports?: SportType[]
  experience_level?: ExperienceLevel
  weekly_training_hours_target?: number
  ftp_watts?: number
  lthr_bpm?: number
  max_hr?: number
}

export interface CreateGoalDto {
  type: GoalType
  target_metric: string
  target_value: number
  target_unit: string
  baseline_value?: number
  target_date?: string
}

export interface OAuthCallbackDto {
  code: string
  state: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ApiError {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
}

// ─── Dashboard aggregations ───────────────────────────────────────────────────

export interface TodayDashboard {
  readiness: ReadinessScore | null
  recommendation: DailyRecommendation | null
  last_activity: TrainingSession | null
  last_recovery: RecoverySession | null
  unread_insights: ImprovementInsight[]
  weekly_summary: {
    load_planned: number
    load_actual: number
    sessions_planned: number
    sessions_completed: number
  }
}

export interface WeeklyDashboard {
  plan: WeeklyPlan | null
  sessions: TrainingSession[]
  readiness_scores: ReadinessScore[]
  load_by_day: { date: string; planned: number; actual: number }[]
  total_distance_km: number
  total_duration_hours: number
  sport_breakdown: { sport: SportType; duration_seconds: number; load: number }[]
}
