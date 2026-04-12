import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { HRVTrendChart } from '@/components/recovery/HRVTrendChart'
import { SleepBreakdownChart } from '@/components/recovery/SleepBreakdownChart'
import { RecoveryScoreHistory } from '@/components/recovery/RecoveryScoreHistory'

export const metadata: Metadata = { title: 'Recuperación' }

export default async function RecoveryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().split('T')[0]

  const [recoveryRes, sleepRes] = await Promise.all([
    supabase.from('recovery_data').select('*').eq('user_id', user.id).gte('date', since).order('date'),
    supabase.from('sleep_data').select('*').eq('user_id', user.id).gte('date', since).order('date'),
  ])

  const recoveryData = (recoveryRes.data ?? []) as any[]
  const sleepData = (sleepRes.data ?? []) as any[]

  const latestRecovery = recoveryData[recoveryData.length - 1]
  const hrv7dAvg = recoveryData.slice(-7).reduce((s: number, d: any) => s + (d.hrv_rmssd_ms ?? 0), 0) / Math.max(1, recoveryData.slice(-7).filter((d: any) => d.hrv_rmssd_ms).length)
  const sleep7dAvg = sleepData.slice(-7).reduce((s: number, d: any) => s + (d.total_sleep_minutes ?? 0), 0) / Math.max(1, sleepData.slice(-7).filter((d: any) => d.total_sleep_minutes).length)

  return (
    <div>
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', margin: 0, letterSpacing: '-0.5px' }}>Recuperación</h1>
        <p style={{ color: 'var(--txt-2)', margin: '3px 0 0', fontSize: 14 }}>Últimos 30 días — HRV, sueño y tendencias</p>
      </div>

      {/* Summary tiles */}
      <div className="animate-in delay-1 grid-4" style={{ marginBottom: '1rem' }}>
        {[
          { label: 'HRV hoy', value: latestRecovery?.hrv_rmssd_ms ? `${Math.round(latestRecovery.hrv_rmssd_ms)}ms` : '—', sub: `Media 7d: ${Math.round(hrv7dAvg)}ms` },
          { label: 'Recovery score', value: latestRecovery?.recovery_score ? `${Math.round(latestRecovery.recovery_score)}%` : '—', sub: latestRecovery?.source ?? 'Sin datos' },
          { label: 'Sueño anoche', value: sleepData.length > 0 ? `${Math.round((sleepData[sleepData.length - 1].total_sleep_minutes ?? 0) / 60 * 10) / 10}h` : '—', sub: sleepData.length > 0 ? `Score: ${sleepData[sleepData.length - 1].sleep_score ?? '—'}` : '' },
          { label: 'Media sueño 7d', value: `${Math.round(sleep7dAvg / 60 * 10) / 10}h`, sub: 'Promedio semanal' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card">
            <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--txt)', marginBottom: 4, letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="animate-in delay-2" style={{ marginBottom: '1rem' }}>
        <HRVTrendChart data={recoveryData} />
      </div>

      <div className="animate-in delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <SleepBreakdownChart data={sleepData.slice(-14)} />
        <RecoveryScoreHistory data={recoveryData} />
      </div>
    </div>
  )
}
