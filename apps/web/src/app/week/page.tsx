import type { Metadata } from 'next'
import { WeeklyLoadChart } from '@/components/week/WeeklyLoadChart'
import { WeekPlanGrid, SportBreakdown } from '@/components/week/WeekPlanGrid'

import type { WeeklyDashboard } from '@athleteos/types'

export const metadata: Metadata = { title: 'Week' }

function getMockWeeklyData(): WeeklyDashboard {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i)
    return d.toISOString().split('T')[0]
  })

  return {
    plan: {
      id: 'wp1', user_id: 'u1', week_start_date: days[0],
      status: 'active', planned_load: 420, target_hours: 8.5,
      periodization_phase: 'build',
      daily_recommendations: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    sessions: [],
    readiness_scores: [],
    load_by_day: days.map((date, i) => ({
      date,
      planned: [65, 0, 95, 40, 90, 110, 20][i] ?? 0,
      actual:  [68, 0, 38, 0,  0,   0,   0][i] ?? 0,
    })),
    total_distance_km: 183,
    total_duration_hours: 7.4,
    sport_breakdown: [
      { sport: 'cycling', duration_seconds: 19800, load: 248 },
      { sport: 'running', duration_seconds: 6780,  load: 76 },
    ],
  }
}

export default function WeekPage() {
  const data = getMockWeeklyData()
  const monday = new Date(data.plan!.week_start_date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const weekLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              This week
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
              {weekLabel} · Build phase, week 3
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Planned load</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)' }}>
                {data.plan?.planned_load} TSS
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--green)' }}>
                {data.load_by_day.reduce((s, d) => s + d.actual, 0)} TSS
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-up delay-1" style={{ marginBottom: '1rem' }}>
        <WeeklyLoadChart loadByDay={data.load_by_day} />
      </div>

      <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <WeekPlanGrid loadByDay={data.load_by_day} />
        <SportBreakdown breakdown={data.sport_breakdown} />
      </div>
    </div>
  )
}
