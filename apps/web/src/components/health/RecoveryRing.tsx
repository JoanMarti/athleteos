'use client'

interface Props {
  score: number          // 0–100 or any value
  max?: number           // default 100
  label: string          // label below
  unit?: string          // e.g. "%" or "/3"
  size?: number          // px
  strokeWidth?: number
  color?: string         // override auto colour
  format?: 'number' | 'fraction'
  denominator?: number   // for fraction display e.g. 2/3
}

const SCORE_COLOR = (score: number, max: number) => {
  const pct = score / max
  if (pct >= 0.8) return '#00d4a8'   // teal — optimal
  if (pct >= 0.6) return '#4299e1'   // blue — good
  if (pct >= 0.4) return '#f5a623'   // amber — moderate
  return '#f56565'                    // red — poor
}

export function RecoveryRing({
  score,
  max = 100,
  label,
  unit,
  size = 130,
  strokeWidth = 10,
  color,
  format = 'number',
  denominator,
}: Props) {
  const r = (size - strokeWidth * 2) / 2 - 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  // Arc goes from ~210° to ~330° — 300° sweep (like the image)
  const SWEEP = 270   // degrees of arc
  const GAP = 360 - SWEEP
  const startAngle = 90 + GAP / 2   // start from bottom-left

  const pct = Math.min(1, Math.max(0, score / max))
  const filled = pct * (circumference * SWEEP / 360)
  const empty  = circumference - filled

  const arcColor = color ?? SCORE_COLOR(score, max)
  const glowId  = `ring-glow-${label.replace(/\s/g, '')}`
  const gradId  = `ring-grad-${label.replace(/\s/g, '')}`

  // Centre display
  const displayValue = format === 'fraction' && denominator
    ? `${score}/${denominator}`
    : `${score}${unit ?? ''}`

  const fontSize = format === 'fraction' ? size * 0.18 : size * 0.22

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size} height={size}
          style={{ transform: `rotate(${startAngle}deg)` }}
        >
          <defs>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={arcColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={arcColor} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Background track — full arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * SWEEP / 360} ${circumference * GAP / 360}`}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${empty + circumference * GAP / 360}`}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Centre number */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: arcColor,
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}>
            {displayValue}
          </span>
        </div>
      </div>

      {/* Label below */}
      <span style={{
        fontSize: size * 0.094,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        maxWidth: size,
      }}>
        {label}
      </span>
    </div>
  )
}
