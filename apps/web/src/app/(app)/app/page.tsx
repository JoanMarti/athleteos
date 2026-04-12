import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ReadinessCard } from '@/components/dashboard/ReadinessCard'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { LastActivityCard } from '@/components/dashboard/LastActivityCard'
import { InsightsFeed } from '@/components/dashboard/InsightsFeed'
import { WeeklySummary } from '@/components/dashboard/WeeklySummary'
import { NutritionCard } from '@/components/dashboard/NutritionCard'
import type { TodayDashboard } from '@athleteos/types'

export const metadata: Metadata = { title: 'Hoy' }

async function getTodayData(userId: string): Promise<TodayDashboard> {
  const supabase = createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMonday()

  const [metricsRes, recRes, lastActivityRes, recoveryRes, sleepRes, insightsRes, weekSessionsRes] = await Promise.all([
    supabase.from('daily_metrics').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('daily_recommendations').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('training_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(1).single(),
    supabase.from('recovery_data').select('*').eq('user_id', userId).eq('date', today).limit(1),
    supabase.from('sleep_data').select('*').eq('user_id', userId).gte('date', new Date(Date.now() - 86400000).toISOString().split('T')[0]).limit(1),
    supabase.from('insights').select('*').eq('user_id', userId).eq('is_read', false).order('generated_at', { ascending: false }).limit(5),
    supabase.from('training_sessions').select('duration_seconds,training_load').eq('user_id', userId).gte('started_at', weekStart),
  ])

  const weekSessions = weekSessionsRes.data ?? []
  const tssActual = weekSessions.reduce((sum: number, s: any) => sum + (s.training_load ?? 0), 0)
  const hoursActual = weekSessions.reduce((sum: number, s: any) => sum + s.duration_seconds, 0) / 3600

  return {
    metrics: metricsRes.data as any,
    recommendation: recRes.data as any,
    last_activity: lastActivityRes.data as any,
    recovery: (recoveryRes.data?.[0] as any) ?? null,
    sleep: (sleepRes.data?.[0] as any) ?? null,
    insights: (insightsRes.data as any[]) ?? [],
    weekly_summary: {
      tss_actual: Math.round(tssActual),
      tss_planned: 420,
      sessions_done: weekSessions.length,
      sessions_planned: 6,
      hours_done: Math.round(hoursActual * 10) / 10,
    },
  }
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default async function TodayPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const data = await getTodayData(user.id)

  const now = new Date()
  const dayName = now.toLocaleDateString('es-ES', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  return (
    <div>
      {/* Header */}
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', margin: 0, letterSpacing: '-0.5px', textTransform: 'capitalize' }}>
              Buenos días
            </h1>
            <p style={{ color: 'var(--txt-2)', margin: '3px 0 0', fontSize: 14, textTransform: 'capitalize' }}>
              {dayName}, {dateStr}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.recovery && (
              <span className="badge badge-green" style={{ fontSize: 11 }}>WHOOP sincronizado</span>
            )}
            {data.last_activity && (
              <span className="badge badge-accent" style={{ fontSize: 11 }}>Strava sincronizado</span>
            )}
          </div>
        </div>
      </div>

      {/* Top row: Readiness + Recommendation */}
      <div className="animate-in delay-1" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <ReadinessCard metrics={data.metrics} recovery={data.recovery} sleep={data.sleep} />
        <RecommendationCard recommendation={data.recommendation} />
      </div>

      {/* Middle row: Last activity + Weekly summary */}
      <div className="animate-in delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <LastActivityCard session={data.last_activity} />
        <WeeklySummary summary={data.weekly_summary} />
      </div>

      {/* Bottom row: Insights + Nutrition */}
      <div className="animate-in delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
        <InsightsFeed insights={data.insights} />
        <NutritionCard tss={data.metrics?.daily_tss ?? 0} weightKg={70} />
      </div>
    </div>
  )
}
