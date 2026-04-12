import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calculateATL, calculateCTL, calculateTSB, calculateReadinessScore } from '@athleteos/utils'

// POST /api/metrics/calculate — called after each sync and daily at 5am
export async function POST(_request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // Get 60 days of sessions for ATL/CTL calc
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString()
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('started_at, training_load')
    .eq('user_id', user.id)
    .gte('started_at', sixtyDaysAgo)
    .order('started_at')

  const sessionsMapped = (sessions ?? []).map((s: any) => ({
    started_at: s.started_at,
    training_load: s.training_load,
  }))

  const atl = calculateATL(sessionsMapped, 7)
  const ctl = calculateCTL(sessionsMapped, 42)
  const tsb = calculateTSB(ctl, atl)

  const dailyTSS = (sessions ?? [])
    .filter((s: any) => s.started_at?.startsWith(today))
    .reduce((sum: number, s: any) => sum + (s.training_load ?? 0), 0)

  // Get latest recovery + sleep data for readiness
  const [recoveryRes, sleepRes, recentRecoveryRes, hrvBaselineRes] = await Promise.all([
    supabase.from('recovery_data').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('sleep_data').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('recovery_data').select('recovery_score').eq('user_id', user.id).order('date', { ascending: false }).limit(3),
    supabase.from('recovery_data')
      .select('hrv_rmssd_ms')
      .eq('user_id', user.id)
      .not('hrv_rmssd_ms', 'is', null)
      .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
      .order('date', { ascending: false }),
  ])

  const latestRecovery = recoveryRes.data as any
  const latestSleep = sleepRes.data as any
  const recent3 = ((recentRecoveryRes.data ?? []) as any[]).map(r => r.recovery_score).filter(Boolean)
  const hrvValues = ((hrvBaselineRes.data ?? []) as any[]).map(r => r.hrv_rmssd_ms).filter(Boolean)

  const hrvAvg = hrvValues.length > 0 ? hrvValues.reduce((a: number, b: number) => a + b, 0) / hrvValues.length : undefined
  const hrvStd = hrvAvg && hrvValues.length > 3
    ? Math.sqrt(hrvValues.reduce((s: number, v: number) => s + Math.pow(v - hrvAvg!, 2), 0) / hrvValues.length)
    : undefined

  const readiness = calculateReadinessScore({
    hrv_ms: latestRecovery?.hrv_rmssd_ms ?? undefined,
    hrv_30d_avg: hrvAvg,
    hrv_30d_stddev: hrvStd,
    sleep_score: latestSleep?.sleep_score ?? undefined,
    sleep_efficiency: latestSleep?.sleep_efficiency ?? undefined,
    atl,
    ctl,
    recovery_scores_3d: recent3.length > 0 ? recent3 : undefined,
  })

  // Count consecutive hard days
  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select('started_at, training_load')
    .eq('user_id', user.id)
    .gte('started_at', new Date(Date.now() - 10 * 86400000).toISOString())
    .order('started_at', { ascending: false })

  let consecutiveHardDays = 0
  const sessionsByDay = new Map<string, number>()
  for (const s of (recentSessions ?? []) as any[]) {
    const d = s.started_at.split('T')[0]
    sessionsByDay.set(d, (sessionsByDay.get(d) ?? 0) + (s.training_load ?? 0))
  }
  const daysSorted = Array.from(sessionsByDay.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  for (const [, load] of daysSorted) {
    if (load > 70) consecutiveHardDays++
    else break
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1))
  const { data: weekSessions } = await supabase
    .from('training_sessions')
    .select('training_load')
    .eq('user_id', user.id)
    .gte('started_at', weekStart.toISOString())

  const weeklyTSS = ((weekSessions ?? []) as any[]).reduce((s, w) => s + (w.training_load ?? 0), 0)

  // Upsert today's metrics
  const { error } = await supabase.from('daily_metrics').upsert({
    user_id: user.id,
    date: today,
    atl, ctl, tsb,
    daily_tss: dailyTSS,
    readiness_score: readiness.score,
    readiness_label: readiness.label,
    readiness_confidence: readiness.confidence,
    hrv_component: readiness.hrv_component,
    sleep_component: readiness.sleep_component,
    load_component: readiness.load_component,
    trend_component: readiness.trend_component,
    weekly_tss_to_date: Math.round(weeklyTSS),
    consecutive_hard_days: consecutiveHardDays,
    calculated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ readiness: readiness.score, label: readiness.label, atl, ctl, tsb })
}
