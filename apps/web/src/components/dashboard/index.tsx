'use client'
import type { DailyMetrics, RecoveryData, SleepData, DailyRecommendation, TrainingSession, Insight } from '@athleteos/types'
import { formatDuration, formatDistance, formatPace } from '@athleteos/utils'

// ─── Readiness Card ───────────────────────────────────────────────────────────

const LABEL_CFG = {
  optimal:  { color: 'var(--r-optimal)', text: 'Forma óptima',   bg: 'rgba(200,241,53,0.08)' },
  good:     { color: 'var(--r-good)',    text: 'Buena forma',    bg: 'rgba(74,222,128,0.08)' },
  moderate: { color: 'var(--r-moderate)',text: 'Moderado',       bg: 'rgba(251,191,36,0.08)' },
  poor:     { color: 'var(--r-poor)',    text: 'Baja forma',     bg: 'rgba(248,113,113,0.08)' },
  rest_day: { color: 'var(--r-rest)',    text: 'Día de descanso',bg: 'rgba(136,146,164,0.08)' },
}

export function ReadinessCard({ metrics, recovery, sleep }: {
  metrics: DailyMetrics | null
  recovery: RecoveryData | null
  sleep: SleepData | null
}) {
  const score = metrics?.readiness_score ?? null
  const label = (metrics?.readiness_label as keyof typeof LABEL_CFG) ?? 'moderate'
  const cfg = LABEL_CFG[label] ?? LABEL_CFG.moderate
  const r = 48
  const circ = 2 * Math.PI * r
  const offset = score !== null ? circ * (1 - score / 100) : circ

  if (!metrics && !recovery) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, textAlign: 'center', gap: 10 }}>
        <div style={{ fontSize: 30 }}>📡</div>
        <div style={{ fontSize: 14, color: 'var(--txt-2)' }}>Sin datos de recuperación</div>
        <a href="/app/profile?tab=integrations" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Conectar WHOOP o Garmin →</a>
      </div>
    )
  }

  const hrvDelta = recovery?.hrv_rmssd_ms && metrics
    ? null
    : null

  const components = [
    { label: 'HRV', value: metrics?.hrv_component ?? 50, color: 'var(--accent)' },
    { label: 'Sueño', value: metrics?.sleep_component ?? 50, color: 'var(--blue)' },
    { label: 'Carga', value: metrics?.load_component ?? 50, color: 'var(--green)' },
    { label: 'Tendencia', value: metrics?.trend_component ?? 50, color: 'var(--amber)' },
  ]

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</span>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>{cfg.text}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
          <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
          {score !== null && (
            <circle cx={60} cy={60} r={r} fill="none" stroke={cfg.color} strokeWidth={9}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              className="ring-path" transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 6px ${cfg.color}55)` }} />
          )}
          <text x={60} y={55} textAnchor="middle" fontFamily="var(--font)" fontSize={26} fontWeight={700} fill={score !== null ? cfg.color : 'var(--txt-3)'}>
            {score !== null ? score : '—'}
          </text>
          <text x={60} y={72} textAnchor="middle" fontFamily="var(--font)" fontSize={11} fill="rgba(255,255,255,0.3)">/100</text>
        </svg>

        <div style={{ flex: 1 }}>
          {recovery?.hrv_rmssd_ms && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>HRV</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--txt)' }}>{recovery.hrv_rmssd_ms}</span>
                <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>ms</span>
              </div>
            </div>
          )}
          {recovery?.resting_hr_bpm && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>FC reposo</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--txt)' }}>{recovery.resting_hr_bpm}</span>
                <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>bpm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component bars */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
        {components.map(c => (
          <div key={c.label} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--txt-2)' }}>{c.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--txt)' }}>{c.value}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${c.value}%`, height: '100%', background: c.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* TSB row */}
      {metrics && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'ATL', value: metrics.atl?.toFixed(0), hint: 'Fatiga' },
            { label: 'CTL', value: metrics.ctl?.toFixed(0), hint: 'Forma' },
            { label: 'TSB', value: `${metrics.tsb > 0 ? '+' : ''}${metrics.tsb?.toFixed(0)}`, hint: 'Balance', color: metrics.tsb >= 0 ? 'var(--green)' : metrics.tsb < -20 ? 'var(--red)' : 'var(--amber)' },
          ].map(m => (
            <div key={m.label} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '7px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: m.color ?? 'var(--txt)' }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

const TYPE_CFG = {
  key_session: { color: 'var(--accent)',  label: 'Sesión clave',   bg: 'var(--accent-glow)' },
  easy:        { color: 'var(--green)',   label: 'Fácil',          bg: 'rgba(74,222,128,0.06)' },
  recovery:    { color: 'var(--blue)',    label: 'Recuperación',   bg: 'rgba(96,165,250,0.06)' },
  rest:        { color: 'var(--txt-3)',   label: 'Descanso',       bg: 'rgba(255,255,255,0.03)' },
  strength:    { color: 'var(--amber)',   label: 'Fuerza',         bg: 'rgba(251,191,36,0.06)' },
  race:        { color: 'var(--red)',     label: 'Carrera',        bg: 'rgba(248,113,113,0.06)' },
}

const SPORT_EMOJI: Record<string, string> = {
  cycling: '🚴', running: '🏃', swimming: '🏊', strength: '💪', triathlon: '🏅', rest: '💤', other: '🏋️'
}

export function RecommendationCard({ recommendation: rec }: { recommendation: DailyRecommendation | null }) {
  if (!rec) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, textAlign: 'center', gap: 10 }}>
        <div style={{ fontSize: 30 }}>⚙️</div>
        <div style={{ fontSize: 14, color: 'var(--txt-2)' }}>Generando recomendación...</div>
        <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>Necesitamos más datos de entrenamiento</div>
      </div>
    )
  }

  const cfg = TYPE_CFG[rec.session_type] ?? TYPE_CFG.easy
  const emoji = SPORT_EMOJI[rec.sport ?? 'other']

  return (
    <div className="card" style={{ borderLeft: `3px solid ${cfg.color}`, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recomendado hoy</span>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: 'var(--txt)', margin: '0 0 4px', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            {rec.title ?? 'Sesión de entrenamiento'}
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {rec.duration_target_min && <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{rec.duration_target_min}min</span>}
            {rec.tss_target && <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>~{rec.tss_target} TSS</span>}
            {rec.intensity_zone && (
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: cfg.color, textTransform: 'uppercase' }}>{rec.intensity_zone}</span>
            )}
          </div>
        </div>
      </div>

      {rec.description && (
        <p style={{ fontSize: 13, color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>{rec.description}</p>
      )}

      {rec.reason && (
        <div style={{ fontSize: 12, color: cfg.color, background: cfg.bg, borderRadius: 'var(--r-sm)', padding: '7px 10px', lineHeight: 1.5 }}>
          {rec.reason}
        </div>
      )}

      {rec.session_type !== 'rest' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Empezar sesión</button>
          <button className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }}>Saltar</button>
        </div>
      )}
    </div>
  )
}

// ─── Last Activity Card ───────────────────────────────────────────────────────

export function LastActivityCard({ session }: { session: TrainingSession | null }) {
  if (!session) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 150, textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: 26 }}>🌙</div>
        <div style={{ fontSize: 14, color: 'var(--txt-2)' }}>Sin actividad reciente</div>
      </div>
    )
  }

  const emoji = SPORT_EMOJI[session.sport_type] ?? '🏋️'
  const daysAgo = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 86400000)
  const zones = session.hr_zone_distribution ?? session.power_zone_distribution
  const zoneColors = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#e879f9']

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Última actividad</span>
        <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>{daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo}d`}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.title ?? 'Actividad'}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Stat label="Tiempo" value={formatDuration(session.duration_seconds)} />
            {session.distance_meters && <Stat label="Dist." value={formatDistance(session.distance_meters)} />}
            {session.average_hr_bpm && <Stat label="FC media" value={`${session.average_hr_bpm} bpm`} />}
            {session.average_power_watts && <Stat label="Potencia" value={`${Math.round(session.average_power_watts)}W`} />}
            {session.average_pace_sec_km && <Stat label="Ritmo" value={formatPace(session.average_pace_sec_km)} />}
          </div>
        </div>
        {session.training_load && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>{Math.round(session.training_load)}</div>
            <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>TSS</div>
          </div>
        )}
      </div>

      {zones && (
        <>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 5 }}>
            {(['z1','z2','z3','z4','z5'] as const).map((z, i) => {
              const pct = (zones[z] ?? 0) * 100
              return pct > 0 ? <div key={z} style={{ flex: zones[z], background: zoneColors[i], borderRadius: 1 }} title={`Z${i+1}: ${Math.round(pct)}%`} /> : null
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['z1','z2','z3','z4','z5'] as const).map((z, i) => {
              const pct = Math.round((zones[z] ?? 0) * 100)
              return pct > 0 ? (
                <span key={z} style={{ fontSize: 10, color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: zoneColors[i] }} />
                  Z{i+1} {pct}%
                </span>
              ) : null
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--txt-2)' }}>{value}</div>
    </div>
  )
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

export function WeeklySummary({ summary }: { summary: TodayDashboard['weekly_summary'] }) {
  const pct = Math.min(100, Math.round((summary.tss_actual / Math.max(summary.tss_planned, 1)) * 100))
  const days = ['L','M','X','J','V','S','D']
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Esta semana</span>
        <span className="badge badge-muted">{summary.sessions_done}/{summary.sessions_planned} sesiones</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1rem' }}>
        {[
          { label: 'Carga real', value: summary.tss_actual, unit: 'TSS' },
          { label: 'Objetivo', value: summary.tss_planned, unit: 'TSS' },
          { label: 'Horas', value: summary.hours_done, unit: 'h' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>{value}</span>
              <span style={{ fontSize: 10, color: 'var(--txt-3)' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Progreso de carga</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: pct >= 80 ? 'var(--green)' : 'var(--txt-2)' }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--green)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Day dots */}
      <div style={{ display: 'flex', gap: 4 }}>
        {days.map((d, i) => (
          <div key={d} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 26, borderRadius: 6, background: i < summary.sessions_done ? 'var(--green-dim)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i < summary.sessions_done ? 'rgba(74,222,128,0.3)' : i === todayIdx ? 'var(--accent)' : 'var(--border)'}`, marginBottom: 3 }} />
            <span style={{ fontSize: 9, color: i === todayIdx ? 'var(--accent)' : 'var(--txt-3)' }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Insights Feed ────────────────────────────────────────────────────────────

export function InsightsFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, color: 'var(--txt-3)', fontSize: 13 }}>
        Sin nuevos insights hoy ✓
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Insights</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map(i => (
          <div key={i.id} className={`insight insight-${i.severity}`}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 3 }}>{i.title}</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>{i.body}</div>
            {i.action && <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 5, fontStyle: 'italic' }}>→ {i.action}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Nutrition Card ───────────────────────────────────────────────────────────

export function NutritionCard({ tss, weightKg }: { tss: number; weightKg: number }) {
  const base = Math.round(weightKg * 30)
  const trainingCals = Math.round(tss * 3.5)
  const total = base + trainingCals

  const highLoad = tss > 80
  const carbs = highLoad ? Math.round(weightKg * 6.5) : Math.round(weightKg * 4)
  const protein = Math.round(weightKg * 1.7)
  const fat = Math.round((total - carbs * 4 - protein * 4) / 9)

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>Nutrición estimada · Hoy</div>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: 'var(--accent)' }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>kcal totales estimadas</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
        {[
          { label: 'Carbohidratos', value: carbs, unit: 'g', color: '#60a5fa', width: (carbs / 500) * 100 },
          { label: 'Proteína', value: protein, unit: 'g', color: '#4ade80', width: (protein / 200) * 100 },
          { label: 'Grasas', value: fat > 0 ? fat : 60, unit: 'g', color: '#fbbf24', width: ((fat > 0 ? fat : 60) / 120) * 100 },
        ].map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{m.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--txt)' }}>{m.value}{m.unit}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, m.width)}%`, height: '100%', background: m.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: 'var(--txt-3)', lineHeight: 1.5 }}>
        Estimaciones orientativas. No constituyen asesoramiento nutricional. Consulta con un dietista para recomendaciones personalizadas.
      </p>
    </div>
  )
}
