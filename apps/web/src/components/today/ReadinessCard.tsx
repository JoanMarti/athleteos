'use client'
import type { ReadinessScore, RecoverySession } from '@athleteos/types'

const LABEL_CONFIG = {
  optimal:  { color: 'var(--readiness-optimal)', text: 'Optimal form',    bg: 'rgba(0,212,168,0.1)' },
  good:     { color: 'var(--readiness-good)',    text: 'Good form',       bg: 'rgba(61,214,140,0.1)' },
  moderate: { color: 'var(--readiness-moderate)',text: 'Moderate',        bg: 'rgba(245,166,35,0.1)' },
  poor:     { color: 'var(--readiness-poor)',    text: 'Low readiness',   bg: 'rgba(245,101,101,0.1)' },
  rest_day: { color: 'var(--readiness-rest)',    text: 'Rest day',        bg: 'rgba(138,143,152,0.1)' },
}

interface Props {
  readiness: ReadinessScore
  recovery?: RecoverySession | null
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - score / 100)

  return (
    <svg width={128} height={128} viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      {/* Progress */}
      <circle
        cx={64} cy={64} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className="score-ring-path"
        transform="rotate(-90 64 64)"
        style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
      {/* Score text */}
      <text
        x={64} y={60}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={28}
        fontWeight={700}
        fill={color}
      >
        {score}
      </text>
      <text
        x={64} y={76}
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize={11}
        fill="rgba(255,255,255,0.4)"
      >
        /100
      </text>
    </svg>
  )
}

function ComponentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {value}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`, height: '100%',
          background: color, borderRadius: 2,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

export function ReadinessCard({ readiness, recovery }: Props) {
  const cfg = LABEL_CONFIG[readiness.label]
  const hrvDelta = recovery?.hrv_ms
    ? Math.round(((recovery.hrv_ms - 55) / 55) * 100) // vs. mock baseline of 55ms
    : null

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Readiness
        </span>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: 11 }}>
          {cfg.text}
        </span>
      </div>

      {/* Ring + HRV */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <ScoreRing score={readiness.score} color={cfg.color} />
        <div style={{ flex: 1 }}>
          {recovery?.hrv_ms && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>HRV (RMSSD)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {recovery.hrv_ms}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ms</span>
                {hrvDelta !== null && (
                  <span style={{ fontSize: 11, color: hrvDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {hrvDelta >= 0 ? '+' : ''}{hrvDelta}% vs avg
                  </span>
                )}
              </div>
            </div>
          )}
          {recovery?.resting_hr_bpm && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Resting HR</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {recovery.resting_hr_bpm}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>bpm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component breakdown */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Score breakdown
        </div>
        <ComponentBar label="HRV" value={readiness.hrv_component} color="var(--accent)" />
        <ComponentBar label="Sleep" value={readiness.sleep_component} color="var(--blue)" />
        <ComponentBar label="Load balance" value={readiness.load_component} color="var(--green)" />
        <ComponentBar label="Recovery trend" value={readiness.recovery_trend_component} color="var(--amber)" />
      </div>

      {/* TSB */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TSB</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 18,
            fontWeight: 500,
            color: readiness.tsb >= 0 ? 'var(--green)' : readiness.tsb < -20 ? 'var(--red)' : 'var(--amber)',
          }}>
            {readiness.tsb > 0 ? '+' : ''}{readiness.tsb}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>ATL / CTL</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
            {readiness.atl} / {readiness.ctl}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>7d load</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
            {readiness.training_load_7d} TSS
          </div>
        </div>
      </div>
    </div>
  )
}
