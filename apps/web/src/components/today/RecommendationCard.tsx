'use client'
import { useState } from 'react'
import type { DailyRecommendation, WorkoutInterval } from '@athleteos/types'

const SESSION_TYPE_CONFIG = {
  key_session: { color: 'var(--accent)',  label: 'Key session',  bg: 'var(--accent-dim)' },
  easy:        { color: 'var(--green)',   label: 'Easy',         bg: 'var(--green-dim)' },
  recovery:    { color: 'var(--blue)',    label: 'Recovery',     bg: 'var(--blue-dim)' },
  rest:        { color: 'var(--text-muted)', label: 'Rest day',  bg: 'rgba(255,255,255,0.04)' },
  strength:    { color: 'var(--amber)',   label: 'Strength',     bg: 'var(--amber-dim)' },
  race:        { color: 'var(--red)',     label: 'Race',         bg: 'var(--red-dim)' },
}

const SPORT_EMOJI: Record<string, string> = {
  cycling: '🚴', running: '🏃', swimming: '🏊', strength: '💪', triathlon: '🏅', rest: '💤', other: '🏋️',
}

const ZONE_COLOR: Record<string, string> = {
  z1: 'var(--blue)', z2: 'var(--green)', z3: 'var(--amber)', z4: 'var(--red)', z5: '#e040fb',
}

function IntervalBlock({ interval, ftp = 248 }: { interval: WorkoutInterval; ftp?: number }) {
  const typeConfig = {
    warmup:   { bg: 'rgba(66,153,225,0.08)', border: 'var(--blue)', label: 'Warmup' },
    interval: { bg: 'rgba(245,101,101,0.08)', border: 'var(--red)', label: 'Interval' },
    rest:     { bg: 'rgba(255,255,255,0.03)', border: 'var(--border)', label: 'Rest' },
    cooldown: { bg: 'rgba(66,153,225,0.08)', border: 'var(--blue)', label: 'Cooldown' },
    steady:   { bg: 'rgba(61,214,140,0.08)', border: 'var(--green)', label: 'Steady' },
  }[interval.type]

  const mins = Math.round(interval.duration_seconds / 60)
  const targetWatts = interval.target_power_pct_ftp
    ? `${Math.round(ftp * interval.target_power_pct_ftp)}W`
    : null

  return (
    <div style={{
      padding: '8px 10px',
      background: typeConfig.bg,
      borderLeft: `2px solid ${typeConfig.border}`,
      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: interval.type === 'interval' ? 2 : 1,
      minWidth: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>{typeConfig.label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {mins}min{targetWatts ? ` · ${targetWatts}` : ''}
        </div>
      </div>
    </div>
  )
}

interface Props {
  recommendation: DailyRecommendation
  ftp?: number
}

export function RecommendationCard({ recommendation: rec, ftp = 248 }: Props) {
  const [showStructure, setShowStructure] = useState(false)
  const cfg = SESSION_TYPE_CONFIG[rec.type]
  const emoji = SPORT_EMOJI[rec.sport] ?? '🏋️'

  const totalIntervals = rec.workout_structure?.main.filter(i => i.type === 'interval').length ?? 0

  return (
    <div className="card" style={{
      borderLeft: `3px solid ${cfg.color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Recommended today
        </span>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-md)',
          background: cfg.bg, border: `1px solid ${cfg.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20, fontWeight: 600,
            color: 'var(--text-primary)', margin: '0 0 4px',
            lineHeight: 1.2,
          }}>
            {rec.title}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {rec.duration_target_minutes}min
            </span>
            {rec.load_target && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                ~{rec.load_target} TSS
              </span>
            )}
            {rec.intensity_target && (
              <span style={{
                fontSize: 12,
                color: ZONE_COLOR[rec.intensity_target],
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}>
                {rec.intensity_target.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
        {rec.description}
      </p>

      {/* Reason chip */}
      <div style={{
        fontSize: 12, color: cfg.color,
        background: cfg.bg,
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        lineHeight: 1.4,
      }}>
        💡 {rec.reason}
      </div>

      {/* Workout structure toggle */}
      {rec.workout_structure && totalIntervals > 0 && (
        <>
          <button
            onClick={() => setShowStructure(v => !v)}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <span style={{ transform: showStructure ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            {showStructure ? 'Hide' : 'Show'} workout structure
          </button>

          {showStructure && rec.workout_structure && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Workout structure
              </div>
              {/* Visual timeline */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {rec.workout_structure.warmup && (
                  <IntervalBlock interval={rec.workout_structure.warmup} ftp={ftp} />
                )}
                {rec.workout_structure.main.map((interval, i) => (
                  <IntervalBlock key={i} interval={interval} ftp={ftp} />
                ))}
                {rec.workout_structure.cooldown && (
                  <IntervalBlock interval={rec.workout_structure.cooldown} ftp={ftp} />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {rec.type !== 'rest' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={{
            flex: 1, padding: '10px',
            background: cfg.color, color: '#0d0f11',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}>
            Start session
          </button>
          <button style={{
            padding: '10px 16px',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Skip
          </button>
        </div>
      )}
    </div>
  )
}
