-- ──────────────────────────────────────────────────────────────────────────────
-- AthleteOS — Database Schema
-- PostgreSQL 16 + TimescaleDB
-- ──────────────────────────────────────────────────────────────────────────────

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  timezone    VARCHAR(100) DEFAULT 'UTC',
  locale      VARCHAR(10)  DEFAULT 'en',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Athlete profiles ──────────────────────────────────────────────────────────
CREATE TABLE athlete_profiles (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name                VARCHAR(100),
  birth_date                  DATE,
  gender                      VARCHAR(20),
  weight_kg                   DECIMAL(5,2),
  height_cm                   DECIMAL(5,1),
  primary_sport               VARCHAR(30) DEFAULT 'cycling',
  secondary_sports            TEXT[] DEFAULT '{}',
  experience_level            VARCHAR(20) DEFAULT 'intermediate',
  weekly_training_hours_target DECIMAL(4,1) DEFAULT 8,
  ftp_watts                   INTEGER,
  lthr_bpm                    INTEGER,
  vo2max_estimate             DECIMAL(5,2),
  max_hr                      INTEGER,
  hr_zones                    JSONB,
  power_zones                 JSONB,
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Connected accounts ────────────────────────────────────────────────────────
CREATE TABLE connected_accounts (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider                 VARCHAR(20) NOT NULL,
  provider_user_id         VARCHAR(255) NOT NULL,
  access_token_encrypted   TEXT NOT NULL,
  refresh_token_encrypted  TEXT,
  token_expires_at         TIMESTAMPTZ,
  scopes                   TEXT[] DEFAULT '{}',
  is_active                BOOLEAN DEFAULT TRUE,
  last_sync_at             TIMESTAMPTZ,
  sync_status              VARCHAR(20) DEFAULT 'pending',
  error_message            TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ── Training sessions ─────────────────────────────────────────────────────────
-- TimescaleDB hypertable partitioned by time
CREATE TABLE training_sessions (
  id                          UUID DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source                      VARCHAR(20) NOT NULL,
  external_id                 VARCHAR(100),
  sport_type                  VARCHAR(30) NOT NULL,
  title                       VARCHAR(255),
  started_at                  TIMESTAMPTZ NOT NULL,
  duration_seconds            INTEGER NOT NULL,
  distance_meters             DECIMAL(10,2),
  elevation_gain_meters       DECIMAL(8,2),
  training_load               DECIMAL(8,2),
  intensity_factor            DECIMAL(5,4),
  normalized_power_watts      DECIMAL(8,2),
  average_power_watts         DECIMAL(8,2),
  average_hr_bpm              INTEGER,
  max_hr_bpm                  INTEGER,
  average_pace_sec_km         DECIMAL(8,2),
  average_cadence_rpm         DECIMAL(6,2),
  calories_estimated          INTEGER,
  hr_zone_distribution        JSONB,
  power_zone_distribution     JSONB,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, started_at)
);

-- Convert to TimescaleDB hypertable (partitioned by month)
SELECT create_hypertable('training_sessions', 'started_at',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE
);

-- Unique constraint: prevent duplicates from same provider
CREATE UNIQUE INDEX uq_training_sessions_external
  ON training_sessions(user_id, source, external_id)
  WHERE external_id IS NOT NULL;

-- ── Recovery sessions ─────────────────────────────────────────────────────────
CREATE TABLE recovery_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source              VARCHAR(20) NOT NULL,
  external_id         VARCHAR(100),
  date                DATE NOT NULL,
  recovery_score      DECIMAL(5,2),
  hrv_ms              DECIMAL(7,3),
  resting_hr_bpm      INTEGER,
  respiratory_rate    DECIMAL(5,2),
  body_battery        DECIMAL(5,2),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source, date)
);

-- ── Sleep metrics ─────────────────────────────────────────────────────────────
CREATE TABLE sleep_metrics (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recovery_session_id     UUID REFERENCES recovery_sessions(id) ON DELETE CASCADE,
  date                    DATE NOT NULL,
  total_duration_minutes  INTEGER,
  light_sleep_minutes     INTEGER,
  deep_sleep_minutes      INTEGER,
  rem_sleep_minutes       INTEGER,
  awake_minutes           INTEGER,
  sleep_efficiency        DECIMAL(5,4),
  sleep_score             DECIMAL(5,2),
  sleep_consistency       DECIMAL(5,2),
  source                  VARCHAR(20),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Readiness scores ─────────────────────────────────────────────────────────
CREATE TABLE readiness_scores (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                            DATE NOT NULL,
  score                           DECIMAL(5,2) NOT NULL,
  hrv_component                   DECIMAL(5,2),
  sleep_component                 DECIMAL(5,2),
  load_component                  DECIMAL(5,2),
  recovery_trend_component        DECIMAL(5,2),
  label                           VARCHAR(20),
  confidence                      DECIMAL(4,3),
  training_load_7d                DECIMAL(8,2),
  training_load_28d               DECIMAL(8,2),
  atl                             DECIMAL(8,2),
  ctl                             DECIMAL(8,2),
  tsb                             DECIMAL(8,2),
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Goals ─────────────────────────────────────────────────────────────────────
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,
  target_metric   VARCHAR(50),
  target_value    DECIMAL(10,3),
  target_unit     VARCHAR(20),
  baseline_value  DECIMAL(10,3),
  current_value   DECIMAL(10,3),
  target_date     DATE,
  is_primary      BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Weekly plans ──────────────────────────────────────────────────────────────
CREATE TABLE weekly_plans (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id               UUID REFERENCES goals(id),
  week_start_date       DATE NOT NULL,
  status                VARCHAR(20) DEFAULT 'active',
  planned_load          DECIMAL(8,2),
  target_hours          DECIMAL(5,2),
  periodization_phase   VARCHAR(20),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- ── Daily recommendations ─────────────────────────────────────────────────────
CREATE TABLE daily_recommendations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_plan_id          UUID REFERENCES weekly_plans(id),
  date                    DATE NOT NULL,
  type                    VARCHAR(20) NOT NULL,
  sport                   VARCHAR(20),
  title                   VARCHAR(255),
  description             TEXT,
  duration_target_minutes INTEGER,
  intensity_target        VARCHAR(5),
  load_target             DECIMAL(8,2),
  workout_structure       JSONB,
  status                  VARCHAR(20) DEFAULT 'pending',
  actual_session_id       UUID,  -- FK after insert
  reason                  TEXT,
  confidence              DECIMAL(4,3),
  rule_ids                TEXT[] DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Nutrition recommendations ─────────────────────────────────────────────────
CREATE TABLE nutrition_recommendations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                      DATE NOT NULL,
  training_load_today       DECIMAL(8,2),
  calories_base             INTEGER,
  calories_training         INTEGER,
  calories_total_estimate   INTEGER,
  carbs_g                   INTEGER,
  protein_g                 INTEGER,
  fat_g                     INTEGER,
  water_ml                  INTEGER,
  electrolytes_recommended  BOOLEAN DEFAULT FALSE,
  timing_suggestions        JSONB,
  notes                     TEXT,
  disclaimer                TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Improvement insights ──────────────────────────────────────────────────────
CREATE TABLE improvement_insights (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_at     TIMESTAMPTZ DEFAULT NOW(),
  insight_type     VARCHAR(30),
  metric           VARCHAR(50),
  title            VARCHAR(255),
  body             TEXT,
  severity         VARCHAR(10) DEFAULT 'info',
  action_suggested TEXT,
  data_points      JSONB,
  is_read          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_training_sessions_user_date ON training_sessions(user_id, started_at DESC);
CREATE INDEX idx_recovery_sessions_user_date ON recovery_sessions(user_id, date DESC);
CREATE INDEX idx_readiness_scores_user_date  ON readiness_scores(user_id, date DESC);
CREATE INDEX idx_insights_user_unread        ON improvement_insights(user_id, is_read, created_at DESC);
CREATE INDEX idx_recommendations_user_date   ON daily_recommendations(user_id, date DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Enable RLS on all user data tables (required for Supabase)
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_metrics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_recommendations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_insights     ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own data
-- Note: auth.uid() is Supabase's JWT user ID function
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'athlete_profiles', 'connected_accounts', 'training_sessions',
    'recovery_sessions', 'sleep_metrics', 'readiness_scores', 'goals',
    'weekly_plans', 'daily_recommendations', 'nutrition_recommendations',
    'improvement_insights'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('
      CREATE POLICY "Users can access own %I" ON %I
        FOR ALL
        USING (auth.uid()::text = user_id::text)
        WITH CHECK (auth.uid()::text = user_id::text)
    ', tbl, tbl);
  END LOOP;
END
$$;
