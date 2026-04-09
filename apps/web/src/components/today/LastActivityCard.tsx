'use client'
import type { TrainingSession, ImprovementInsight } from '@athleteos/types'
import { formatDuration, formatDistance, formatPace } from '@athleteos/utils'

// ─── LastActivityCard ─────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  cycling: '🚴', running: '🏃', swimming: '🏊',
  strength: '💪', triathlon: '🏅', other: '🏋️',
}

function ZoneBar({ distribution }: { distribution: Record<string, number> }) {
  const zones = ['z1','z2','z3','z4','z5'] as const
  const zoneColors = ['var(--blue)','var(--green)','var(--amber)','var(--red)','#e040fb']
  const zoneLabels = ['Z1','Z2','Z3','Z4','Z5']

  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
        {zones.map((z, i) => {
          const pct = (distribution[z] ?? 0) * 100
          return pct > 0 ? (
            <div key={z} style={{ width: `${pct}%`, background: zoneColors[i], transition: 'width 0.5s' }} title={`${zoneLabels[i]}: ${Math.round(pct)}%`} />
          ) : null
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {zones.map((z, i) => {
          const pct = Math.round((distribution[z] ?? 0) * 100)
          return pct > 0 ? (
            <span key={z} style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: zoneColors[i] }} />
              {zoneLabels[i]} {pct}%
            </span>
          ) : null
        })}
      </div>
    </div>
  )
}

export function LastActivityCard({ session }: { session: TrainingSession | null }) {
  if (!session) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: 28 }}>🌙</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No recent activity</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rest days count too.</div>
      </div>
    )
  }

  const emoji = SPORT_EMOJI[session.sport_type] ?? '🏋️'
  const daysAgo = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 86400000)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Last activity
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.title}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Metric label="Duration" value={formatDuration(session.duration_seconds)} />
            {session.distance_meters && <Metric label="Distance" value={formatDistance(session.distance_meters)} />}
            {session.average_hr_bpm && <Metric label="Avg HR" value={`${session.average_hr_bpm} bpm`} />}
            {session.average_pace_sec_km && <Metric label="Pace" value={formatPace(session.average_pace_sec_km)} />}
            {session.average_power_watts && <Metric label="Avg power" value={`${session.average_power_watts}W`} />}
          </div>
        </div>
        {session.training_load && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>
              {Math.round(session.training_load)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TSS</div>
          </div>
        )}
      </div>

      {session.hr_zone_distribution && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <ZoneBar distribution={session.hr_zone_distribution} />
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  )
}

// ─── WeeklySummaryBar ─────────────────────────────────────────────────────────

interface WeeklySummary {
  load_planned: number
  load_actual: number
  sessions_planned: number
  sessions_completed: number
}

export function WeeklySummaryBar({ summary }: { summary: WeeklySummary }) {
  const loadPct = Math.min(100, Math.round((summary.load_actual / summary.load_planned) * 100))
  const sessionPct = Math.round((summary.sessions_completed / summary.sessions_planned) * 100)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          This week
        </span>
        <span className="badge badge-muted">
          {summary.sessions_completed}/{summary.sessions_planned} sessions
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <BigMetric label="Load so far" value={String(summary.load_actual)} unit="TSS" />
        <BigMetric label="Week target" value={String(summary.load_planned)} unit="TSS" />
      </div>

      {/* Load progress bar */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekly load progress</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: loadPct >= 80 ? 'var(--green)' : 'var(--text-secondary)' }}>
            {loadPct}%
          </span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${loadPct}%`, height: '100%',
            background: loadPct >= 80 ? 'var(--green)' : 'var(--accent)',
            borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Day dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: '1rem' }}>
        {['M','T','W','T','F','S','S'].map((day, i) => {
          const isDone = i < summary.sessions_completed
          const isToday = i === new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 28, borderRadius: 'var(--radius-sm)',
                background: isDone ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isDone ? 'var(--green)' : isToday ? 'var(--accent)' : 'var(--border)'}`,
                marginBottom: 4,
              }} />
              <div style={{ fontSize: 9, color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>{day}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BigMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
          {value}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  )
}

// ─── InsightsList ─────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  info:    { class: 'insight-info',    icon: '↗', label: 'Insight' },
  warning: { class: 'insight-warning', icon: '⚠', label: 'Warning' },
  alert:   { class: 'insight-alert',   icon: '!', label: 'Alert' },
}

export function InsightsList({ insights }: { insights: ImprovementInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 14 }}>
        No new insights today ✓
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
        Insights & alerts
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map(insight => {
          const cfg = SEVERITY_CONFIG[insight.severity]
          return (
            <div
              key={insight.id}
              className={cfg.class}
              style={{
                borderLeft: '3px solid',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                padding: '12px 14px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flexShrink: 0, fontSize: 12, marginTop: 1 }}>{cfg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {insight.body}
                </div>
                {insight.action_suggested && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                    → {insight.action_suggested}
                  </div>
                )}
              </div>
              <span className={`badge badge-${insight.severity === 'info' ? 'muted' : insight.severity === 'warning' ? 'amber' : 'red'}`}
                style={{ flexShrink: 0, fontSize: 10 }}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
