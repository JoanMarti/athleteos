'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts'
import type { StravaActivity, SuuntoActivity } from '@/lib/healthEngine'

interface Props {
  strava: StravaActivity[]
  suunto: SuuntoActivity[]
  atl: number
  ctl: number
  tsb: number
  risk: 'low' | 'moderate' | 'high'
}

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

const RISK_COLOR = { low: '#3dd68c', moderate: '#f5a623', high: '#f56565' }
const RISK_LABEL = { low: 'Low overtraining risk', moderate: 'Monitor load carefully', high: 'High risk — reduce intensity' }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1c1f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: '#8a8f98', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, marginBottom: 3 }}>
          <span style={{ color: p.color ?? p.fill }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#f0f0f0' }}>
            {typeof p.value === 'number' ? Math.round(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function LoadChart({ strava, suunto, atl, ctl, tsb, risk }: Props) {
  // Build 30-day combined dataset
  const today = new Date()
  const chartData: {date: string; label: string; tss: number; atl_v: number; ctl_v: number}[] = []

  // Simple daily TSS accumulation
  const tssByDate: Record<string, number> = {}
  for (const a of strava) {
    const t = a.tss ?? (a.moving_time_s / 3600 * (a.avg_hr ? 56 : 40))
    tssByDate[a.date] = (tssByDate[a.date] ?? 0) + Math.round(t)
  }
  for (const s of suunto) {
    const t = Math.round((s.duration_s / 3600) * 45)
    tssByDate[s.date] = (tssByDate[s.date] ?? 0) + t
  }

  let runAtl = 0, runCtl = 0
  const k_atl = 1 - Math.exp(-1 / 7)
  const k_ctl = 1 - Math.exp(-1 / 42)

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const tss = tssByDate[key] ?? 0
    runAtl = runAtl + k_atl * (tss - runAtl)
    runCtl = runCtl + k_ctl * (tss - runCtl)
    chartData.push({
      date: key,
      label: fmtDate(key),
      tss,
      atl_v: Math.round(runAtl),
      ctl_v: Math.round(runCtl),
    })
  }

  const riskColor = RISK_COLOR[risk]

  return (
    <div>
      {/* ATL/CTL/TSB summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Fatigue (ATL)', value: atl, color: '#f56565', desc: '7-day load' },
          { label: 'Fitness (CTL)', value: ctl, color: '#4299e1', desc: '42-day load' },
          { label: 'Form (TSB)', value: tsb, color: tsb > 5 ? '#3dd68c' : tsb > -10 ? '#f5a623' : '#f56565', desc: 'CTL − ATL' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px',
            borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>
              {tsb < 0 && s.label.includes('Form') ? '' : ''}{s.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#555b65', fontSize: 10 }}
              axisLine={false} tickLine={false}
              interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: '#555b65', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="tss" name="Daily TSS" fill="rgba(66,153,225,0.3)" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="atl_v" name="ATL" stroke="#f56565" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ctl_v" name="CTL" stroke="#4299e1" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Risk banner */}
      <div style={{
        marginTop: 12, padding: '10px 14px',
        background: `${riskColor}10`,
        border: `1px solid ${riskColor}30`,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, color: riskColor,
      }}>
        <span style={{ fontSize: 16 }}>{risk === 'low' ? '✓' : risk === 'moderate' ? '⚠' : '⚡'}</span>
        <span>{RISK_LABEL[risk]}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          ATL/CTL ratio: {(atl / (ctl || 1)).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
