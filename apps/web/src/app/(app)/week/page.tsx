import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { WeeklyLoadChart } from '@/components/week/WeeklyLoadChart'
import { WeekPlanGrid } from '@/components/week/WeekPlanGrid'
import { SportBreakdown } from '@/components/week/SportBreakdown'
import { ATLCTLChart } from '@/components/week/ATLCTLChart'

export const metadata: Metadata = { title: 'Semana' }

function getMonday(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function WeekPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const monday = getMonday()
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)

  const [sessionsRes, metricsRes] = await Promise.all([
    supabase.from('training_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', monday.toISOString())
      .lt('started_at', sunday.toISOString())
      .order('started_at'),
    supabase.from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monday.toISOString().split('T')[0])
      .order('date'),
  ])

  const sessions = sessionsRes.data ?? []
  const metrics = metricsRes.data ?? []

  // Build load_by_day
  const loadByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' })
    const actual = sessions
      .filter(s => s.started_at.startsWith(dateStr))
      .reduce((sum: number, s: any) => sum + (s.training_load ?? 0), 0)
    return { date: dateStr, planned: [65, 0, 95, 40, 90, 110, 20][i] ?? 0, actual: Math.round(actual), label: dayLabel }
  })

  // Sport breakdown
  const sportMap = new Map<string, { duration_seconds: number; tss: number; distance_km: number }>()
  for (const s of sessions as any[]) {
    const entry = sportMap.get(s.sport_type) ?? { duration_seconds: 0, tss: 0, distance_km: 0 }
    entry.duration_seconds += s.duration_seconds
    entry.tss += s.training_load ?? 0
    entry.distance_km += (s.distance_meters ?? 0) / 1000
    sportMap.set(s.sport_type, entry)
  }
  const sportBreakdown = Array.from(sportMap.entries()).map(([sport, d]) => ({ sport: sport as any, ...d, tss: Math.round(d.tss), distance_km: Math.round(d.distance_km * 10) / 10 }))

  const totals = {
    tss: Math.round(sessions.reduce((sum: number, s: any) => sum + (s.training_load ?? 0), 0)),
    hours: Math.round(sessions.reduce((sum: number, s: any) => sum + s.duration_seconds, 0) / 360) / 10,
    distance_km: Math.round(sessions.reduce((sum: number, s: any) => sum + (s.distance_meters ?? 0), 0) / 100) / 10,
    elevation_m: Math.round(sessions.reduce((sum: number, s: any) => sum + (s.elevation_gain_meters ?? 0), 0)),
  }

  const weekLabel = `${monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${new Date(sunday.getTime() - 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`

  // Last 30 days of metrics for ATL/CTL chart
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: longMetrics } = await supabase.from('daily_metrics').select('date,atl,ctl,tsb').eq('user_id', user.id).gte('date', thirtyDaysAgo.toISOString().split('T')[0]).order('date')

  return (
    <div>
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', margin: 0, letterSpacing: '-0.5px' }}>Esta semana</h1>
            <p style={{ color: 'var(--txt-2)', margin: '3px 0 0', fontSize: 14 }}>{weekLabel}</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Carga total', value: totals.tss, unit: 'TSS' },
              { label: 'Horas', value: totals.hours, unit: 'h' },
              { label: 'Distancia', value: totals.distance_km, unit: 'km' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>{value} <span style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 400 }}>{unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-in delay-1" style={{ marginBottom: '1rem' }}>
        <WeeklyLoadChart loadByDay={loadByDay} />
      </div>

      <div className="animate-in delay-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <WeekPlanGrid loadByDay={loadByDay} />
        <SportBreakdown breakdown={sportBreakdown} />
      </div>

      <div className="animate-in delay-3">
        <ATLCTLChart data={(longMetrics ?? []) as any[]} />
      </div>
    </div>
  )
}
