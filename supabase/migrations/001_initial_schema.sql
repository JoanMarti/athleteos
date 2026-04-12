-- ============================================================
-- AthleteOS — Complete Database Schema
-- Supabase (PostgreSQL 15+)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search

-- ─────────────────────────────────────────────────────────────
-- USERS & PROFILES
-- ─────────────────────────────────────────────────────────────

-- Extended user profile (supplements Supabase auth.users)
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  full_name       text,
  avatar_url      text,
  bio             text,
  country         text,
  timezone        text default 'UTC',
  locale          text default 'en',
  onboarding_done boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Athlete-specific data (sport metrics, targets)
create table public.athlete_profiles (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null unique references public.profiles(id) on delete cascade,

  -- Sport & experience
  primary_sport                text default 'cycling',  -- cycling|running|triathlon|swimming|fitness
  secondary_sports             text[] default '{}',
  experience_level             text default 'intermediate', -- beginner|intermediate|advanced|elite
  gender                       text,  -- male|female|non_binary|prefer_not

  -- Physical stats
  date_of_birth                date,
  weight_kg                    numeric(5,2),
  height_cm                    numeric(5,1),

  -- Cycling performance metrics
  ftp_watts                    integer,           -- Functional Threshold Power
  ftp_updated_at               timestamptz,
  w_prime_joules               integer,           -- W' (anaerobic work capacity)
  max_aerobic_power_watts      integer,

  -- Running performance metrics
  lthr_bpm                     integer,           -- Lactate Threshold Heart Rate
  threshold_pace_sec_km        numeric(6,2),      -- e.g. 240 = 4:00/km
  run_vo2max_estimate          numeric(5,2),

  -- Heart rate
  max_hr_bpm                   integer,
  resting_hr_bpm               integer,

  -- Calculated zones (stored as JSONB for flexibility)
  hr_zones                     jsonb,   -- {z1:[0,120], z2:[121,140], ...}
  power_zones                  jsonb,   -- {z1:[0,150], z2:[151,200], ...}
  pace_zones                   jsonb,   -- {z1:[0,300], ...} sec/km

  -- Training targets
  weekly_training_hours_target numeric(4,1) default 8,
  weekly_tss_target            integer,

  updated_at timestamptz default now()
);

-- Training goals
create table public.goals (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text not null, -- ftp_improvement|race_prep|weight_loss|endurance|vo2max|time_goal|general
  title          text not null,
  description    text,
  target_metric  text,   -- "FTP", "10K time", "weight", etc.
  target_value   numeric(10,3),
  target_unit    text,   -- "watts", "seconds", "kg", etc.
  baseline_value numeric(10,3),
  current_value  numeric(10,3),
  target_date    date,
  is_primary     boolean default false,
  status         text default 'active', -- active|achieved|abandoned|paused
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- CONNECTED INTEGRATIONS
-- ─────────────────────────────────────────────────────────────

create table public.connected_integrations (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,

  -- Provider
  provider                text not null, -- strava|garmin|suunto|wahoo|whoop|intervals|trainingpeaks|polar|coros
  provider_user_id        text,
  provider_username       text,
  provider_display_name   text,
  provider_avatar_url     text,

  -- OAuth tokens (AES-256-GCM encrypted)
  access_token_enc        text,
  refresh_token_enc       text,
  token_expires_at        timestamptz,
  token_type              text default 'Bearer',
  scopes                  text[] default '{}',

  -- For API-key providers (Intervals.icu)
  api_key_enc             text,

  -- Sync state
  is_active               boolean default true,
  is_primary              boolean default false, -- main activity source
  last_sync_at            timestamptz,
  last_sync_status        text default 'pending', -- pending|syncing|success|error|rate_limited
  last_sync_error         text,
  sync_cursor             text, -- last processed event ID / timestamp for incremental sync
  total_activities_synced integer default 0,

  -- Metadata
  provider_metadata       jsonb default '{}', -- provider-specific extra data
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),

  unique(user_id, provider)
);

-- ─────────────────────────────────────────────────────────────
-- TRAINING DATA
-- ─────────────────────────────────────────────────────────────

create table public.training_sessions (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,

  -- Source
  source_provider           text not null, -- strava|garmin|etc.
  external_id               text,          -- ID in source provider
  external_url              text,

  -- Session info
  sport_type                text not null, -- cycling|running|swimming|strength|triathlon|other
  title                     text,
  description               text,
  started_at                timestamptz not null,
  ended_at                  timestamptz,
  duration_seconds          integer not null,
  moving_time_seconds       integer,
  elapsed_time_seconds      integer,

  -- Distance & elevation
  distance_meters           numeric(10,2),
  elevation_gain_meters     numeric(8,2),
  elevation_loss_meters     numeric(8,2),

  -- Power (cycling)
  average_power_watts       numeric(8,2),
  normalized_power_watts    numeric(8,2),
  max_power_watts           integer,
  intensity_factor          numeric(5,4),
  variability_index         numeric(5,4),

  -- Heart rate
  average_hr_bpm            integer,
  max_hr_bpm                integer,
  min_hr_bpm                integer,

  -- Running specific
  average_pace_sec_km       numeric(8,2),
  average_cadence_rpm       numeric(6,2),
  average_stride_length_m   numeric(5,3),
  ground_contact_time_ms    integer,
  vertical_oscillation_mm   integer,

  -- Cycling specific
  average_speed_kph         numeric(6,2),
  max_speed_kph             numeric(6,2),

  -- Load & stress
  training_load             numeric(8,2),  -- Normalized TSS
  training_stress_score     numeric(8,2),  -- Raw TSS
  suffer_score              integer,       -- Strava native
  perceived_exertion        integer,       -- RPE 1-10

  -- Energy
  calories_estimated        integer,
  kilojoules                numeric(10,2),

  -- Conditions
  average_temp_celsius      numeric(5,2),
  weather_conditions        text,

  -- Zone distributions (0.0-1.0 fractions)
  hr_zone_distribution      jsonb,    -- {z1:0.2, z2:0.5, z3:0.2, z4:0.08, z5:0.02}
  power_zone_distribution   jsonb,

  -- Equipment
  gear_id                   text,
  device_name               text,

  -- Flags
  is_race                   boolean default false,
  is_manual                 boolean default false,
  is_commute                boolean default false,
  is_trainer                boolean default false,

  -- Raw data reference
  raw_data_ref              text,  -- S3 key for full stream data

  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),

  unique(user_id, source_provider, external_id)
);

create index idx_sessions_user_date on public.training_sessions(user_id, started_at desc);
create index idx_sessions_sport on public.training_sessions(user_id, sport_type, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- RECOVERY & WELLNESS
-- ─────────────────────────────────────────────────────────────

create table public.recovery_data (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  source_provider   text not null,
  date              date not null,

  -- Recovery scores (normalized 0-100)
  recovery_score    numeric(5,2),  -- WHOOP, Garmin Body Battery, etc.
  readiness_score   numeric(5,2),  -- Our calculated score

  -- HRV
  hrv_rmssd_ms      numeric(7,3),
  hrv_sdnn_ms       numeric(7,3),

  -- Cardiovascular
  resting_hr_bpm    integer,
  blood_oxygen_pct  numeric(5,2),
  respiratory_rate  numeric(5,2),

  -- Temperature
  skin_temp_celsius numeric(5,2),
  core_temp_celsius numeric(5,2),

  -- Body battery (Garmin specific)
  body_battery_end  integer,

  -- Raw provider score
  provider_score    numeric(5,2),
  provider_label    text,  -- "green", "yellow", "red"

  raw_data          jsonb default '{}',
  created_at        timestamptz default now(),

  unique(user_id, source_provider, date)
);

create table public.sleep_data (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  source_provider           text not null,
  date                      date not null,  -- The night: date sleep started

  -- Timing
  sleep_start               timestamptz,
  sleep_end                 timestamptz,
  total_sleep_minutes       integer,
  total_in_bed_minutes      integer,
  awake_minutes             integer,

  -- Stages (minutes)
  light_sleep_minutes       integer,
  deep_sleep_minutes        integer,
  rem_sleep_minutes         integer,

  -- Quality metrics
  sleep_score               numeric(5,2),
  sleep_efficiency          numeric(5,4),  -- 0-1
  sleep_consistency         numeric(5,2),  -- % vs habitual time

  -- Disturbances
  disturbance_count         integer,
  respiratory_rate          numeric(5,2),

  raw_data                  jsonb default '{}',
  created_at                timestamptz default now(),

  unique(user_id, source_provider, date)
);

-- ─────────────────────────────────────────────────────────────
-- CALCULATED METRICS (daily aggregations)
-- ─────────────────────────────────────────────────────────────

create table public.daily_metrics (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  date            date not null,

  -- Training load model
  atl             numeric(8,2),   -- Acute Training Load (7-day EMA)
  ctl             numeric(8,2),   -- Chronic Training Load (42-day EMA)
  tsb             numeric(8,2),   -- Training Stress Balance = CTL - ATL
  daily_tss       numeric(8,2),   -- TSS for this day

  -- Readiness (0-100)
  readiness_score     numeric(5,2),
  readiness_label     text,  -- optimal|good|moderate|poor|rest_day
  readiness_confidence numeric(4,3),

  -- Components
  hrv_component       numeric(5,2),
  sleep_component     numeric(5,2),
  load_component      numeric(5,2),
  trend_component     numeric(5,2),

  -- Weekly context
  weekly_tss_to_date  numeric(8,2),
  consecutive_hard_days integer default 0,

  calculated_at   timestamptz default now(),

  unique(user_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- RECOMMENDATIONS
-- ─────────────────────────────────────────────────────────────

create table public.daily_recommendations (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  date                    date not null,

  session_type            text not null,   -- key_session|easy|recovery|rest|strength|race
  sport                   text,
  title                   text,
  description             text,
  duration_target_min     integer,
  intensity_zone          text,            -- z1-z5
  tss_target              numeric(8,2),
  workout_structure       jsonb,

  -- Engine metadata
  status                  text default 'pending',  -- pending|done|skipped|modified
  reason                  text,
  rule_id                 text,
  confidence              numeric(4,3),
  actual_session_id       uuid references public.training_sessions(id),

  created_at              timestamptz default now(),
  unique(user_id, date)
);

-- Insights
create table public.insights (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text,         -- overtraining_risk|pr_detected|efficiency_gain|consistency_drop|etc
  title          text,
  body           text,
  severity       text default 'info',  -- info|warning|alert
  action         text,
  data_points    jsonb,
  is_read        boolean default false,
  generated_at   timestamptz default now(),
  created_at     timestamptz default now()
);

-- Nutrition recommendations
create table public.nutrition_recommendations (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  date                   date not null,
  training_load_today    numeric(8,2),
  calories_base          integer,
  calories_training      integer,
  calories_total         integer,
  carbs_g                integer,
  protein_g              integer,
  fat_g                  integer,
  water_ml               integer,
  electrolytes           boolean default false,
  timing_suggestions     jsonb,
  disclaimer             text default 'Estimates only. Consult a nutritionist for personalized advice.',
  created_at             timestamptz default now(),
  unique(user_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.profiles                  enable row level security;
alter table public.athlete_profiles          enable row level security;
alter table public.goals                     enable row level security;
alter table public.connected_integrations    enable row level security;
alter table public.training_sessions         enable row level security;
alter table public.recovery_data             enable row level security;
alter table public.sleep_data                enable row level security;
alter table public.daily_metrics             enable row level security;
alter table public.daily_recommendations     enable row level security;
alter table public.insights                  enable row level security;
alter table public.nutrition_recommendations enable row level security;

-- Policies: users can only access their own data
do $$ declare t text; begin
  foreach t in array array[
    'profiles','athlete_profiles','goals','connected_integrations',
    'training_sessions','recovery_data','sleep_data','daily_metrics',
    'daily_recommendations','insights','nutrition_recommendations'
  ] loop
    execute format(
      'create policy "own_data_%s" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
  end loop;
end $$;

-- Profile special case (id, not user_id)
drop policy if exists "own_data_profiles" on public.profiles;
create policy "own_profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS: auto-create profile on signup
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.athlete_profiles (user_id) values (new.id);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.athlete_profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.connected_integrations
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.training_sessions
  for each row execute procedure public.set_updated_at();
