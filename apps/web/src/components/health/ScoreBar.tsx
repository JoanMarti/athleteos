'use client'

interface Props {
  label: string
  value: number        // 0–100 score
  rawValue?: string    // e.g. "65 ms" or "7h 45m"
  color: string
  icon: string
  description?: string
}

export function ScoreBar({ label, value, rawValue, color, icon, description }: Props) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${color}15`,
            border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
            {description && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
            {value}
          </div>
          {rawValue && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{rawValue}</div>
          )}
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: 3,
          boxShadow: `0 0 8px ${color}55`,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}
