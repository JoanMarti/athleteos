'use client'

interface DayLoad { date: string; planned: number; actual: number }

const SESSION_TYPES = [
  { threshold: 90, label: 'Key session', color: 'var(--accent)' },
  { threshold: 60, label: 'Quality',     color: 'var(--amber)' },
  { threshold: 25, label: 'Easy',        color: 'var(--green)' },
  { threshold: 1,  label: 'Recovery',    color: 'var(--blue)' },
  { threshold: 0,  label: 'Rest',        color: 'var(--text-muted)' },
]

function getSessionType(load: number) {
  return SESSION_TYPES.find(t => load >= t.threshold) ?? SESSION_TYPES[SESSION_TYPES.length - 1]
}

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export function WeekPlanGrid({ loadByDay }: { loadByDay: DayLoad[] }) {
  const today = new Date().toDateString()

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
        Week plan
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loadByDay.map((day, i) => {
          const isToday = new Date(day.date).toDateString() === today
          const isDone = day.actual > 0
          const sessionType = getSessionType(day.planned)
          const maxLoad = Math.max(...loadByDay.map(d => d.planned), 1)
          const barWidth = (day.planned / maxLoad) * 100
          const actualWidth = (day.actual / maxLoad) * 100

          return (
            <div key={day.date} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: isToday ? 'rgba(0,212,168,0.04)' : 'transparent',
              border: isToday ? '1px solid rgba(0,212,168,0.15)' : '1px solid transparent',
            }}>
              {/* Day name */}
              <div style={{ width: 32, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>
                  {DAY_SHORT[i]}
                </div>
              </div>

              {/* Bar area */}
              <div style={{ flex: 1, position: 'relative', height: 24 }}>
                {/* Planned bar */}
                {day.planned > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    width: `${barWidth}%`, height: '100%',
                    background: `${sessionType.color}1a`,
                    border: `1px solid ${sessionType.color}55`,
                    borderRadius: 4,
                  }} />
                )}
                {/* Actual bar */}
                {day.actual > 0 && (
                  <div style={{
                    position: 'absolute', top: 4, left: 0,
                    width: `${actualWidth}%`, height: 'calc(100% - 8px)',
                    background: sessionType.color,
                    borderRadius: 3, opacity: 0.9,
                  }} />
                )}
                {day.planned === 0 && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rest</span>
                  </div>
                )}
              </div>

              {/* Session type */}
              <div style={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: day.planned > 0 ? sessionType.color : 'var(--text-muted)' }}>
                  {getSessionType(day.planned).label}
                </span>
              </div>

              {/* TSS */}
              <div style={{ width: 52, flexShrink: 0, textAlign: 'right' }}>
                {day.planned > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isDone ? 'var(--green)' : 'var(--text-muted)' }}>
                    {isDone ? day.actual : day.planned}
                  </span>
                )}
              </div>

              {/* Done indicator */}
              <div style={{ width: 16, flexShrink: 0 }}>
                {day.planned > 0 && (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: isDone ? 'var(--green-dim)' : 'transparent',
                    border: `1.5px solid ${isDone ? 'var(--green)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: 'var(--green)',
                  }}>
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

// ─── SportBreakdown ───────────────────────────────────────────────────────────

interface SportItem {
  sport: string
  duration_seconds: number
  load: number
}

const SPORT_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  cycling:   { emoji: '🚴', color: 'var(--accent)',  label: 'Cycling' },
  running:   { emoji: '🏃', color: 'var(--green)',   label: 'Running' },
  swimming:  { emoji: '🏊', color: 'var(--blue)',    label: 'Swimming' },
  strength:  { emoji: '💪', color: 'var(--amber)',   label: 'Strength' },
  triathlon: { emoji: '🏅', color: 'var(--red)',     label: 'Triathlon' },
}

export function SportBreakdown({ breakdown }: { breakdown: SportItem[] }) {
  const totalLoad = breakdown.reduce((s, b) => s + b.load, 0)
  const totalDuration = breakdown.reduce((s, b) => s + b.duration_seconds, 0)
  const totalHours = Math.floor(totalDuration / 3600)
  const totalMins = Math.round((totalDuration % 3600) / 60)

  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
        Sport breakdown
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: '1.25rem' }}>
        {breakdown.map(b => {
          const cfg = SPORT_CONFIG[b.sport] ?? { color: 'var(--text-muted)', emoji: '', label: b.sport }
          return (
            <div key={b.sport} style={{
              flex: b.load / totalLoad,
              background: cfg.color,
              borderRadius: 2,
            }} />
          )
        })}
      </div>

      {/* Sport rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {breakdown.map(b => {
          const cfg = SPORT_CONFIG[b.sport] ?? { color: 'var(--text-muted)', emoji: '🏋️', label: b.sport }
          const hrs = Math.floor(b.duration_seconds / 3600)
          const mins = Math.round((b.duration_seconds % 3600) / 60)
          const pct = Math.round((b.load / totalLoad) * 100)
          return (
            <div key={b.sport} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {hrs > 0 ? `${hrs}h ` : ''}{mins}min
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: cfg.color }}>{b.load}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pct}%</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Total time</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalHours}h {totalMins}m
          </div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Total load</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalLoad} TSS
          </div>
        </div>
      </div>
    </div>
  )
}
