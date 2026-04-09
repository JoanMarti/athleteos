import type { Metadata } from 'next'
import { HRVTrendChart, SleepBreakdownChart, LoadBalanceChart } from '@/components/recovery/HRVTrendChart'



export const metadata: Metadata = { title: 'Recovery' }

// 30 days of mock recovery data
function getMockRecoveryData() {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hrv: Math.round(50 + Math.sin(i * 0.4) * 18 + Math.random() * 10),
      sleep_score: Math.round(72 + Math.sin(i * 0.3 + 1) * 15 + Math.random() * 8),
      deep_min: Math.round(68 + Math.random() * 30),
      rem_min: Math.round(75 + Math.random() * 35),
      light_min: Math.round(140 + Math.random() * 50),
      awake_min: Math.round(12 + Math.random() * 15),
      recovery_score: Math.round(60 + Math.sin(i * 0.35) * 22 + Math.random() * 12),
      atl: Math.round(40 + i * 0.9 + Math.sin(i * 0.5) * 12),
      ctl: Math.round(45 + i * 0.6),
    }
  })
  return days
}

export default function RecoveryPage() {
  const data = getMockRecoveryData()
  const latest = data[data.length - 1]
  const hrvAvg = Math.round(data.slice(-7).reduce((s, d) => s + d.hrv, 0) / 7)
  const sleepAvg = Math.round(data.slice(-7).reduce((s, d) => s + d.sleep_score, 0) / 7)

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
          Recovery
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
          30-day trends from WHOOP — HRV, sleep and load balance
        </p>
      </div>

      {/* Summary row */}
      <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <SummaryTile label="HRV today" value={`${latest.hrv}ms`} delta={`${latest.hrv > hrvAvg ? '+' : ''}${latest.hrv - hrvAvg}ms vs 7d`} positive={latest.hrv >= hrvAvg} />
        <SummaryTile label="Recovery score" value={`${latest.recovery_score}%`} delta="WHOOP score" neutral />
        <SummaryTile label="Sleep score (7d avg)" value={`${sleepAvg}`} delta="WHOOP quality index" neutral />
        <SummaryTile label="HRV 7d avg" value={`${hrvAvg}ms`} delta={`${data.length}d trend`} neutral />
      </div>

      {/* HRV chart */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: '1rem' }}>
        <HRVTrendChart data={data} />
      </div>

      {/* Sleep + load */}
      <div className="animate-fade-up delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <SleepBreakdownChart data={data.slice(-14)} />
        <LoadBalanceChart data={data} />
      </div>
    </div>
  )
}

function SummaryTile({ label, value, delta, positive, neutral }: {
  label: string; value: string; delta: string; positive?: boolean; neutral?: boolean
}) {
  const deltaColor = neutral ? 'var(--text-muted)' : positive ? 'var(--green)' : 'var(--red)'
  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: deltaColor }}>{delta}</div>
    </div>
  )
}
