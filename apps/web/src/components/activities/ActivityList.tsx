'use client'
import { useState } from 'react'
import type { TrainingSession } from '@athleteos/types'
import { formatDuration, formatDistance, formatPace } from '@athleteos/utils'
import { PROVIDER_META } from '@athleteos/types'

const SPORT_EMOJI: Record<string, string> = {
  cycling: '🚴', running: '🏃', swimming: '🏊', strength: '💪', triathlon: '🏅', hiking: '🥾', other: '🏋️',
}
const ZONE_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#e879f9']
const SPORT_LABELS: Record<string, string> = {
  cycling: 'Ciclismo', running: 'Running', swimming: 'Natación',
  strength: 'Fuerza', triathlon: 'Triatlón', hiking: 'Senderismo', other: 'Otro',
}

type Filter = 'all' | 'cycling' | 'running' | 'swimming' | 'strength' | 'other'

export function ActivityList({ sessions }: { sessions: TrainingSession[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filter === 'all' ? sessions : sessions.filter(s =>
    filter === 'other' ? !['cycling','running','swimming','strength'].includes(s.sport_type) : s.sport_type === filter
  )

  const FILTERS: { v: Filter; l: string; e: string }[] = [
    { v: 'all',      l: 'Todas',    e: '📋' },
    { v: 'cycling',  l: 'Ciclismo', e: '🚴' },
    { v: 'running',  l: 'Running',  e: '🏃' },
    { v: 'swimming', l: 'Natación', e: '🏊' },
    { v: 'strength', l: 'Fuerza',   e: '💪' },
    { v: 'other',    l: 'Otros',    e: '🏋️' },
  ]

  if (sessions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--txt-2)' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🏁</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sin actividades todavía</div>
        <div style={{ fontSize: 14, color: 'var(--txt-3)', marginBottom: 20 }}>Conecta Strava o Garmin para importar tus actividades</div>
        <a href="/app/profile?tab=integrations" className="btn btn-primary" style={{ display: 'inline-flex' }}>Conectar fuentes →</a>
      </div>
    )
  }

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map(({ v, l, e }) => (
          <button key={v} onClick={() => setFilter(v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: filter === v ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${filter === v ? 'var(--accent)' : 'var(--border)'}`, color: filter === v ? 'var(--accent)' : 'var(--txt-2)', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 13 }}>{e}</span>{l}
            {v !== 'all' && <span style={{ fontSize: 10, color: 'inherit', opacity: 0.7 }}>({sessions.filter(s => v === 'other' ? !['cycling','running','swimming','strength'].includes(s.sport_type) : s.sport_type === v).length})</span>}
          </button>
        ))}
      </div>

      {/* Activity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(session => {
          const isOpen = expanded === session.id
          const zones = session.hr_zone_distribution ?? session.power_zone_distribution
          const providerColor = PROVIDER_META[session.source_provider as keyof typeof PROVIDER_META]?.color ?? 'var(--txt-3)'

          return (
            <div key={session.id} className="card" style={{ cursor: 'pointer', padding: '14px 16px' }} onClick={() => setExpanded(isOpen ? null : session.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Sport icon */}
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {SPORT_EMOJI[session.sport_type] ?? '🏋️'}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.title ?? SPORT_LABELS[session.sport_type] ?? 'Actividad'}
                    </span>
                    {session.is_race && <span className="badge badge-red" style={{ fontSize: 9 }}>Carrera</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>
                    {new Date(session.started_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    <span style={{ margin: '0 6px', color: 'var(--border-md)' }}>·</span>
                    <span style={{ color: providerColor }}>{PROVIDER_META[session.source_provider as keyof typeof PROVIDER_META]?.label ?? session.source_provider}</span>
                  </div>
                </div>

                {/* Key metrics */}
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--txt)' }}>{formatDuration(session.duration_seconds)}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>duración</div>
                  </div>
                  {session.distance_meters && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--txt)' }}>{formatDistance(session.distance_meters)}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>distancia</div>
                    </div>
                  )}
                  {session.training_load && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>{Math.round(session.training_load)}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>TSS</div>
                    </div>
                  )}
                </div>

                <span style={{ color: 'var(--txt-3)', fontSize: 12, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>

              {/* Zone bar */}
              {zones && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                    {(['z1','z2','z3','z4','z5'] as const).map((z, i) => {
                      const pct = (zones[z] ?? 0) * 100
                      return pct > 0 ? <div key={z} style={{ flex: zones[z], background: ZONE_COLORS[i] }} title={`Z${i+1}: ${Math.round(pct)}%`} /> : null
                    })}
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'FC media', value: session.average_hr_bpm ? `${session.average_hr_bpm} bpm` : null },
                    { label: 'FC máx', value: session.max_hr_bpm ? `${session.max_hr_bpm} bpm` : null },
                    { label: 'Potencia NP', value: session.normalized_power_watts ? `${Math.round(session.normalized_power_watts)}W` : null },
                    { label: 'Potencia avg', value: session.average_power_watts ? `${Math.round(session.average_power_watts)}W` : null },
                    { label: 'Ritmo', value: session.average_pace_sec_km ? formatPace(session.average_pace_sec_km) : null },
                    { label: 'Cadencia', value: session.average_cadence_rpm ? `${Math.round(session.average_cadence_rpm)} rpm` : null },
                    { label: 'Desnivel', value: session.elevation_gain_meters ? `+${Math.round(session.elevation_gain_meters)}m` : null },
                    { label: 'Calorías', value: session.calories_estimated ? `${session.calories_estimated} kcal` : null },
                    { label: 'IF', value: session.intensity_factor ? session.intensity_factor.toFixed(2) : null },
                  ].filter(m => m.value).map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--txt)' }}>{value}</div>
                    </div>
                  ))}
                  {session.external_url && (
                    <div style={{ gridColumn: '1/-1', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <a href={session.external_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                        Ver en {PROVIDER_META[session.source_provider as keyof typeof PROVIDER_META]?.label} →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
