import type { Metadata } from 'next'
import { ReadinessCard } from '@/components/today/ReadinessCard'
import { RecommendationCard } from '@/components/today/RecommendationCard'
import { LastActivityCard, InsightsList, WeeklySummaryBar } from '@/components/today/LastActivityCard'


import type { TodayDashboard } from '@athleteos/types'

export const metadata: Metadata = { title: 'Today' }

// In production this would be fetched server-side with the user's auth token
function getMockTodayData(): TodayDashboard {
  return {
    readiness: {
      id: 'r1',
      user_id: 'u1',
      date: new Date().toISOString().split('T')[0],
      score: 82,
      hrv_component: 87,
      sleep_component: 76,
      load_component: 81,
      recovery_trend_component: 84,
      label: 'good',
      confidence: 0.92,
      training_load_7d: 382,
      training_load_28d: 341,
      atl: 72,
      ctl: 68,
      tsb: -4,
      created_at: new Date().toISOString(),
    },
    recommendation: {
      id: 'rec1',
      user_id: 'u1',
      date: new Date().toISOString().split('T')[0],
      type: 'key_session',
      sport: 'cycling',
      title: 'Threshold intervals — 5×8min',
      description: '5 intervals at 95–105% FTP (236–260W). Full 3min recovery between each. Focus on holding power steady, not HR.',
      duration_target_minutes: 75,
      intensity_target: 'z4',
      load_target: 95,
      status: 'pending',
      reason: 'Readiness 82/100 + FTP goal active — ideal window for threshold work.',
      confidence: 0.89,
      rule_ids: ['R006'],
      workout_structure: {
        warmup: { type: 'warmup', duration_seconds: 900, target_hr_zone: 'z2', description: '15min progressive warmup' },
        main: [
          { type: 'interval', duration_seconds: 480, target_power_pct_ftp: 1.0, target_hr_zone: 'z4', description: 'Interval 1/5 — hold 236–260W' },
          { type: 'rest', duration_seconds: 180, target_hr_zone: 'z1', description: 'Easy spin' },
          { type: 'interval', duration_seconds: 480, target_power_pct_ftp: 1.0, target_hr_zone: 'z4', description: 'Interval 2/5' },
          { type: 'rest', duration_seconds: 180, target_hr_zone: 'z1', description: 'Easy spin' },
          { type: 'interval', duration_seconds: 480, target_power_pct_ftp: 1.0, target_hr_zone: 'z4', description: 'Interval 3/5' },
          { type: 'rest', duration_seconds: 180, target_hr_zone: 'z1', description: 'Easy spin' },
          { type: 'interval', duration_seconds: 480, target_power_pct_ftp: 1.0, target_hr_zone: 'z4', description: 'Interval 4/5' },
          { type: 'rest', duration_seconds: 180, target_hr_zone: 'z1', description: 'Easy spin' },
          { type: 'interval', duration_seconds: 480, target_power_pct_ftp: 1.0, target_hr_zone: 'z4', description: 'Interval 5/5 — finish strong' },
        ],
        cooldown: { type: 'cooldown', duration_seconds: 600, target_hr_zone: 'z1', description: '10min easy cooldown' },
      },
      created_at: new Date().toISOString(),
    },
    last_activity: {
      id: 'a1',
      user_id: 'u1',
      source: 'strava',
      external_id: '10002',
      sport_type: 'running',
      title: 'Easy recovery run',
      started_at: new Date(Date.now() - 86400000).toISOString(),
      duration_seconds: 3180,
      distance_meters: 9300,
      elevation_gain_meters: 45,
      training_load: 38,
      average_hr_bpm: 132,
      max_hr_bpm: 148,
      average_pace_sec_km: 342,
      calories_estimated: 520,
      hr_zone_distribution: { z1: 0.12, z2: 0.71, z3: 0.14, z4: 0.03, z5: 0 },
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    last_recovery: {
      id: 'rec_1',
      user_id: 'u1',
      source: 'whoop',
      date: new Date().toISOString().split('T')[0],
      recovery_score: 82,
      hrv_ms: 65,
      resting_hr_bpm: 44,
      respiratory_rate: 14.2,
      created_at: new Date().toISOString(),
    },
    unread_insights: [
      {
        id: 'i1', user_id: 'u1',
        generated_at: new Date().toISOString(),
        insight_type: 'performance_gain',
        metric: 'avg_power_hr_ratio',
        title: 'Aerobic efficiency improving',
        body: 'Same power output at 4 bpm lower avg HR vs. 3 weeks ago. Your aerobic base is strengthening.',
        severity: 'info',
        action_suggested: 'Keep the Z2 volume consistent — you\'re adapting well.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'i2', user_id: 'u1',
        generated_at: new Date().toISOString(),
        insight_type: 'pr_detected',
        metric: 'normalized_power_3h',
        title: 'Personal best — 3h normalized power',
        body: 'Saturday\'s long ride: NP 231W for 3h12 — your highest 3-hour power output on record.',
        severity: 'info',
        action_suggested: 'This suggests FTP has improved. Consider a test in 2 weeks.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'i3', user_id: 'u1',
        generated_at: new Date().toISOString(),
        insight_type: 'overtraining_risk',
        metric: 'tsb',
        title: 'TSB approaching caution zone',
        body: 'Training Stress Balance is at -41. You\'re accumulating fatigue. Monitor HRV this week.',
        severity: 'warning',
        action_suggested: 'Keep Friday as a rest day. Don\'t add extra sessions this week.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ],
    weekly_summary: {
      load_planned: 420,
      load_actual: 199,
      sessions_planned: 6,
      sessions_completed: 2,
    },
  }
}

export default function TodayPage() {
  const data = getMockTodayData()
  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              Good morning, Alex
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
              {dayName}, {dateStr} · Week 13 of build phase
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-green">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              Strava synced
            </span>
            <span className="badge badge-accent">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              WHOOP synced
            </span>
          </div>
        </div>
      </div>

      {/* Top row: Readiness + Recommendation */}
      <div className="animate-fade-up delay-1" style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <ReadinessCard readiness={data.readiness!} recovery={data.last_recovery} />
        <RecommendationCard recommendation={data.recommendation!} />
      </div>

      {/* Second row: Last activity + Weekly summary */}
      <div className="animate-fade-up delay-2" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <LastActivityCard session={data.last_activity} />
        <WeeklySummaryBar summary={data.weekly_summary} />
      </div>

      {/* Third row: Insights */}
      <div className="animate-fade-up delay-3">
        <InsightsList insights={data.unread_insights} />
      </div>
    </div>
  )
}
