'use client'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts'
import type { FitbitSleepStage } from '@/lib/healthEngine'

interface Props {
  data: FitbitSleepStage[]
  baseline?: number
  trend: 'rising' | 'stable' | 'declining'
}

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

const TREND_CONFIG = {
  rising:   { color: '#3dd68c', label: '↑ Rising', desc: 'Recovery improving' },
  stable:   { color: '#00d4a8', label: '→ Stable', desc: 'Consistent recovery' },
  declining:{ color: '#f5a623', label: '↓ Declining', desc: 'Monitor fatigue' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1c1f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: '#8a8f98', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#00d4a8' }}>
        {payload[0]?.value} ms
      </div>
      <div style={{ fontSize: 11, color: '#8a8f98', marginTop: 2 }}>RMSSD</div>
    </div>
  )
}

export function HRVChart({ data, baseline = 55, trend }: Props) {
  const cfg = TREND_CONFIG[trend]
  const chartData = data
    .filter(d => d.hrv_rmssd)
    .slice(-14)
    .map(d => ({
      date: fmtDate(d.dateTime),
      hrv: d.hrv_rmssd,
    }))

  const latest = chartData[chartData.length - 1]?.hrv ?? 0
  const latestVsBaseline = latest - baseline
  const pct = Math.round((latestVsBaseline / baseline) * 100)

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Latest HRV</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', color: cfg.color, lineHeight: 1 }}>{latest}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>ms</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>vs baseline</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: latestVsBaseline >= 0 ? '#3dd68c' : '#f56565' }}>
            {latestVsBaseline >= 0 ? '+' : ''}{latestVsBaseline.toFixed(1)} ms ({pct >= 0 ? '+' : ''}{pct}%)
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cfg.desc}</div>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
            <defs>
              <linearGradient id="hrv-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={cfg.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#555b65', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555b65', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <ReferenceLine y={baseline} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"
              label={{ value: `baseline ${baseline}ms`, fill: '#555b65', fontSize: 10, position: 'insideTopLeft' }} />
            <Area
              type="monotone" dataKey="hrv"
              stroke={cfg.color} strokeWidth={2}
              fill="url(#hrv-grad)" dot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: cfg.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Baseline calculated from your 30-day rolling average. Source: Fitbit overnight RMSSD.
      </div>
    </div>
  )
}
