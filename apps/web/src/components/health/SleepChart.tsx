'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import type { FitbitSleepStage } from '@/lib/healthEngine'

interface Props { data: FitbitSleepStage[] }

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

function fmtMins(m: number) {
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div style={{
      background: '#1a1c1f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', minWidth: 160,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0', marginBottom: 8 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: p.fill, marginBottom: 3 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#f0f0f0' }}>{fmtMins(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, fontSize: 11, color: '#8a8f98', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: '#f0f0f0' }}>{fmtMins(total)}</span>
      </div>
    </div>
  )
}

export function SleepChart({ data }: Props) {
  const chartData = data.slice(-14).map(d => ({
    date: fmtDate(d.dateTime),
    Deep: d.deep_min,
    REM: d.rem_min,
    Light: d.light_min,
    Awake: d.awake_min,
    score: d.score,
    hrv: d.hrv_rmssd,
  }))

  return (
    <div>
      {/* Mini stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'Avg total', value: fmtMins(Math.round(data.slice(-7).reduce((a, d) => a + d.duration_min, 0) / 7)), color: '#4299e1' },
          { label: 'Avg deep', value: fmtMins(Math.round(data.slice(-7).reduce((a, d) => a + d.deep_min, 0) / 7)), color: '#00d4a8' },
          { label: 'Avg REM', value: fmtMins(Math.round(data.slice(-7).reduce((a, d) => a + d.rem_min, 0) / 7)), color: '#9f7aea' },
          { label: 'Avg SpO₂', value: `${(data.slice(-7).filter(d => d.spo2_avg).reduce((a, d) => a + (d.spo2_avg ?? 0), 0) / data.slice(-7).filter(d => d.spo2_avg).length).toFixed(1)}%`, color: '#f5a623' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 100px', minWidth: 80,
            background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px',
            borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={12}>
            <XAxis dataKey="date" tick={{ fill: '#555b65', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555b65', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${Math.floor(v / 60)}h`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine y={480} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" label={{ value: '8h', fill: '#555b65', fontSize: 10, position: 'right' }} />
            <Bar dataKey="Deep"  stackId="s" fill="#00d4a8" radius={[0,0,0,0]} />
            <Bar dataKey="REM"   stackId="s" fill="#9f7aea" />
            <Bar dataKey="Light" stackId="s" fill="#4299e1" />
            <Bar dataKey="Awake" stackId="s" fill="rgba(245,101,101,0.5)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Deep', color: '#00d4a8' },
          { label: 'REM', color: '#9f7aea' },
          { label: 'Light', color: '#4299e1' },
          { label: 'Awake', color: 'rgba(245,101,101,0.6)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
