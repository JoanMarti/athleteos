'use client'

interface Source {
  name: string
  connected: boolean
  color: string
  icon: string
  lastSync?: string
}

const SOURCES: Source[] = [
  { name: 'Fitbit', connected: true, color: '#00B0B9', icon: '💙', lastSync: 'This morning' },
  { name: 'Strava', connected: true, color: '#FC4C02', icon: '🟠', lastSync: '2h ago' },
  { name: 'Suunto', connected: true, color: '#E8000B', icon: '🔴', lastSync: 'Yesterday' },
]

export function SourceBadges() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SOURCES.map(s => (
        <div key={s.name} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-elevated)',
          border: `1px solid ${s.connected ? s.color + '44' : 'var(--border)'}`,
          borderRadius: 20, padding: '4px 10px',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: s.connected ? s.color : 'var(--text-muted)',
            boxShadow: s.connected ? `0 0 6px ${s.color}` : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: s.connected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {s.name}
          </span>
          {s.lastSync && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.lastSync}</span>
          )}
        </div>
      ))}
    </div>
  )
}
