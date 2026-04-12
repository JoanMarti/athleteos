'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 5, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: p.color ?? p.fill, fontWeight: 600 }}>{typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function dateLabel(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── HRV Trend ────────────────────────────────────────────────────────────────
export function HRVTrendChart({ data }: { data: any[] }) {
  const chartData = data.filter(d => d.hrv_rmssd_ms).map(d => ({
    label: dateLabel(d.date),
    hrv: Math.round(d.hrv_rmssd_ms * 10) / 10,
    recovery: d.recovery_score ? Math.round(d.recovery_score) : undefined,
  }))

  const avg = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.hrv, 0) / chartData.length) : 0

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HRV — 30 días (RMSSD ms)</span>
        {avg > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Media: {avg}ms</span>}
      </div>
      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--txt-3)', fontSize: 13 }}>Conecta WHOOP o Garmin para ver tu HRV</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="hrv-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 7)} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTip />} />
            {avg > 0 && <ReferenceLine y={avg} stroke="rgba(200,241,53,0.35)" strokeDasharray="4 4" />}
            <Area type="monotone" dataKey="hrv" name="HRV" stroke="var(--accent)" strokeWidth={2} fill="url(#hrv-grad)" dot={false} activeDot={{ r: 4, fill: 'var(--accent)' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Sleep Breakdown ──────────────────────────────────────────────────────────
export function SleepBreakdownChart({ data }: { data: any[] }) {
  const chartData = data.map(d => ({
    label: dateLabel(d.date),
    deep: Math.round((d.deep_sleep_minutes ?? 0)),
    rem: Math.round((d.rem_sleep_minutes ?? 0)),
    light: Math.round((d.light_sleep_minutes ?? 0)),
    awake: Math.round((d.awake_minutes ?? 0)),
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fases del sueño — 14 noches</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['Profundo','var(--accent)'],['REM','#7c6bf0'],['Ligero','var(--blue)'],['Despierto','rgba(255,255,255,0.2)']].map(([l, c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
            </span>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--txt-3)', fontSize: 13 }}>Sin datos de sueño disponibles</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="deep"  name="Profundo" stackId="s" fill="var(--accent)" />
            <Bar dataKey="rem"   name="REM"      stackId="s" fill="#7c6bf0" />
            <Bar dataKey="light" name="Ligero"   stackId="s" fill="var(--blue)" />
            <Bar dataKey="awake" name="Despierto" stackId="s" fill="rgba(255,255,255,0.15)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Recovery Score History ───────────────────────────────────────────────────
export function RecoveryScoreHistory({ data }: { data: any[] }) {
  const chartData = data.filter(d => d.recovery_score).map(d => ({
    label: dateLabel(d.date),
    score: Math.round(d.recovery_score),
    fill: d.recovery_score >= 67 ? '#4ade80' : d.recovery_score >= 34 ? '#fbbf24' : '#f87171',
  }))

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>Recovery score — historial</div>
      {chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--txt-3)', fontSize: 13 }}>Sin datos de recovery disponibles</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 7)} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={67} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 4" />
              <ReferenceLine y={34} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" />
              <Bar dataKey="score" name="Recovery" radius={[4,4,0,0]}>
                {chartData.map((d, i) => (
                  <rect key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
            {[['Verde ≥67', 'var(--green)'], ['Amarillo 34-66', 'var(--amber)'], ['Rojo <34', 'var(--red)']].map(([l, c]) => (
              <div key={l} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 6, padding: '5px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: 10, color: c }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
