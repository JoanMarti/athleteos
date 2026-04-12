'use client'
import {
  ComposedChart, Bar, Line, LineChart, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { SportType } from '@athleteos/types'
import { formatDuration } from '@athleteos/utils'

// ─── Shared tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 5, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: p.color ?? p.fill, fontWeight: 600 }}>{typeof p.value === 'number' ? Math.round(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Weekly Load Chart ────────────────────────────────────────────────────────
export function WeeklyLoadChart({ loadByDay }: { loadByDay: { date: string; planned: number; actual: number; label: string }[] }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Carga semanal — planificado vs. real</span>
        <div style={{ display: 'flex', gap: 14 }}>
          {[{ label: 'Planificado', color: 'rgba(200,241,53,0.5)' }, { label: 'Real', color: '#4ade80' }].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={loadByDay} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="planned" name="Planificado" fill="rgba(200,241,53,0.12)" stroke="rgba(200,241,53,0.4)" strokeWidth={1.5} radius={[4,4,0,0]} />
          <Bar dataKey="actual" name="Real" fill="#4ade80" radius={[4,4,0,0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Week Plan Grid ───────────────────────────────────────────────────────────
const SESSION_TYPE_THRESHOLDS = [
  { min: 90, label: 'Sesión clave', color: 'var(--accent)' },
  { min: 60, label: 'Calidad',      color: 'var(--amber)' },
  { min: 25, label: 'Fácil',        color: 'var(--green)' },
  { min: 1,  label: 'Recuperación', color: 'var(--blue)' },
  { min: 0,  label: 'Descanso',     color: 'var(--txt-3)' },
]
function getSessionLabel(load: number) {
  return SESSION_TYPE_THRESHOLDS.find(t => load >= t.min) ?? SESSION_TYPE_THRESHOLDS[4]
}

export function WeekPlanGrid({ loadByDay }: { loadByDay: { date: string; planned: number; actual: number; label: string }[] }) {
  const maxLoad = Math.max(...loadByDay.map(d => d.planned), 1)
  const today = new Date().toISOString().split('T')[0]
  const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Plan de la semana</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loadByDay.map((day, i) => {
          const isToday = day.date === today
          const isDone = day.actual > 0
          const type = getSessionLabel(day.planned)
          const bw = (day.planned / maxLoad) * 100
          const aw = (day.actual / maxLoad) * 100

          return (
            <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-md)', background: isToday ? 'rgba(200,241,53,0.04)' : 'transparent', border: isToday ? '1px solid rgba(200,241,53,0.15)' : '1px solid transparent' }}>
              <div style={{ width: 72, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--accent)' : 'var(--txt-2)' }}>{DAY_NAMES[i]}</div>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 22 }}>
                {day.planned > 0 && (
                  <div style={{ position: 'absolute', inset: 0, width: `${bw}%`, background: `${type.color}15`, border: `1px solid ${type.color}44`, borderRadius: 4 }} />
                )}
                {isDone && (
                  <div style={{ position: 'absolute', top: 4, left: 0, width: `${aw}%`, height: 'calc(100% - 8px)', background: type.color, borderRadius: 3, opacity: 0.85 }} />
                )}
                {day.planned === 0 && <span style={{ fontSize: 11, color: 'var(--txt-3)', paddingLeft: 4, lineHeight: '22px' }}>Descanso</span>}
              </div>
              <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: day.planned > 0 ? type.color : 'var(--txt-3)' }}>{type.label}</span>
              </div>
              <div style={{ width: 44, flexShrink: 0, textAlign: 'right' }}>
                {day.planned > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isDone ? 'var(--green)' : 'var(--txt-3)' }}>{isDone ? day.actual : day.planned}</span>}
              </div>
              <div style={{ width: 16, flexShrink: 0 }}>
                {day.planned > 0 && (
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: isDone ? 'var(--green-dim)' : 'transparent', border: `1.5px solid ${isDone ? 'var(--green)' : 'var(--border-md)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'var(--green)' }}>
                    {isDone ? '✓' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sport Breakdown ──────────────────────────────────────────────────────────
const SPORT_META: Record<string, { emoji: string; color: string; label: string }> = {
  cycling:   { emoji: '🚴', color: 'var(--accent)',  label: 'Ciclismo' },
  running:   { emoji: '🏃', color: 'var(--green)',   label: 'Running' },
  swimming:  { emoji: '🏊', color: 'var(--blue)',    label: 'Natación' },
  strength:  { emoji: '💪', color: 'var(--amber)',   label: 'Fuerza' },
  triathlon: { emoji: '🏅', color: 'var(--red)',     label: 'Triatlón' },
  other:     { emoji: '🏋️', color: 'var(--txt-3)',  label: 'Otros' },
}

export function SportBreakdown({ breakdown }: { breakdown: { sport: SportType; duration_seconds: number; tss: number; distance_km: number }[] }) {
  const totalTSS = breakdown.reduce((s, b) => s + b.tss, 0)
  const totalDuration = breakdown.reduce((s, b) => s + b.duration_seconds, 0)

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Por deporte</div>

      {breakdown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--txt-3)', fontSize: 13 }}>Sin actividades esta semana</div>
      ) : (
        <>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: '1rem' }}>
            {breakdown.map(b => {
              const meta = SPORT_META[b.sport] ?? SPORT_META.other
              return <div key={b.sport} style={{ flex: b.tss / totalTSS, background: meta.color, borderRadius: 2 }} />
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map(b => {
              const meta = SPORT_META[b.sport] ?? SPORT_META.other
              const pct = totalTSS > 0 ? Math.round((b.tss / totalTSS) * 100) : 0
              return (
                <div key={b.sport} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 1 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{formatDuration(b.duration_seconds)}{b.distance_km > 0 ? ` · ${b.distance_km}km` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: meta.color }}>{b.tss}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>{pct}% TSS</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Total tiempo', value: formatDuration(totalDuration) },
              { label: 'Total TSS', value: String(totalTSS) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ATL/CTL/TSB Chart ────────────────────────────────────────────────────────
export function ATLCTLChart({ data }: { data: { date: string; atl: number; ctl: number; tsb: number }[] }) {
  const chartData = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ATL / CTL / TSB — 30 días</span>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'ATL (fatiga)', color: 'var(--red)' },
            { label: 'CTL (forma)', color: 'var(--green)' },
            { label: 'TSB (balance)', color: 'var(--amber)', dashed: true },
          ].map(({ label, color, dashed }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ width: 16, height: 2, background: color, display: 'inline-block', backgroundImage: dashed ? `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` : undefined }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 6)} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
          <Line type="monotone" dataKey="atl" name="ATL" stroke="#f87171" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ctl" name="CTL" stroke="#4ade80" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="tsb" name="TSB" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
        {[
          { range: '>10', label: 'Fresco', color: 'var(--green)' },
          { range: '-10→10', label: 'Balance', color: 'var(--txt-2)' },
          { range: '-20→-10', label: 'Cargado', color: 'var(--amber)' },
          { range: '<-20', label: 'Alta fatiga', color: 'var(--red)' },
        ].map(({ range, label, color }) => (
          <div key={range} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 6, padding: '5px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, marginBottom: 2 }}>TSB {range}</div>
            <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
