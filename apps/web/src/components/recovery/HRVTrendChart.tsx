'use client'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ─── Shared tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1f2124', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: p.color ?? p.fill, fontWeight: 500 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── HRV Trend Chart ──────────────────────────────────────────────────────────

export function HRVTrendChart({ data }: { data: Array<{ label: string; hrv: number; recovery_score: number }> }) {
  const avgHRV = Math.round(data.reduce((s, d) => s + d.hrv, 0) / data.length)
  const showLabels = data.length <= 14 ? data : data.filter((_, i) => i % 3 === 0 || i === data.length - 1)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          HRV trend — 30 days
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />
            HRV (ms)
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 2, background: 'rgba(0,212,168,0.4)', display: 'inline-block' }} />
            30d avg
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4a8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00d4a8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false}
            interval={Math.floor(data.length / 7)} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false}
            domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={avgHRV} stroke="rgba(0,212,168,0.35)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="hrv" name="HRV" stroke="#00d4a8" strokeWidth={2}
            fill="url(#hrvGrad)" dot={false} activeDot={{ r: 4, fill: '#00d4a8' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Sleep Breakdown Chart ─────────────────────────────────────────────────────

export function SleepBreakdownChart({ data }: { data: Array<{ label: string; deep_min: number; rem_min: number; light_min: number; awake_min: number }> }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sleep stages — 14 days
        </span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Deep', color: '#00d4a8' },
            { label: 'REM',  color: '#7c6bf0' },
            { label: 'Light', color: '#4299e1' },
            { label: 'Awake', color: 'rgba(255,255,255,0.2)' },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} stackOffset="none">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="deep_min"  name="Deep"  stackId="sleep" fill="#00d4a8" radius={[0,0,0,0]} />
          <Bar dataKey="rem_min"   name="REM"   stackId="sleep" fill="#7c6bf0" />
          <Bar dataKey="light_min" name="Light" stackId="sleep" fill="#4299e1" />
          <Bar dataKey="awake_min" name="Awake" stackId="sleep" fill="rgba(255,255,255,0.15)" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Load Balance Chart (ATL/CTL/TSB) ────────────────────────────────────────

export function LoadBalanceChart({ data }: { data: Array<{ label: string; atl: number; ctl: number }> }) {
  const chartData = data.map(d => ({ ...d, tsb: d.ctl - d.atl }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ATL / CTL / TSB — 30 days
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'ATL (fatigue)',  color: 'var(--red)' },
            { label: 'CTL (fitness)', color: 'var(--green)' },
            { label: 'TSB (form)',    color: 'var(--amber)' },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 16, height: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false}
            interval={Math.floor(data.length / 6)} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
          <Line type="monotone" dataKey="atl" name="ATL" stroke="#f56565" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ctl" name="CTL" stroke="#3dd68c" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="tsb" name="TSB" stroke="#f5a623" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '0.75rem', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        TSB guide: <span style={{ color: 'var(--green)' }}>&gt;10 fresh</span> · <span style={{ color: 'var(--text-secondary)' }}>-10 to 10 balanced</span> · <span style={{ color: 'var(--amber)' }}>-20 to -10 some fatigue</span> · <span style={{ color: 'var(--red)' }}>&lt;-20 high fatigue</span>
      </div>
    </div>
  )
}
