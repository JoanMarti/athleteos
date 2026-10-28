'use client'

interface Props {
  value: number        // 0–100
  label: string
  size?: number
  zones?: { pct: number; color: string }[]  // colour segments
}

const DEFAULT_ZONES = [
  { pct: 0.33, color: '#3dd68c' },   // green  — good assimilation
  { pct: 0.33, color: '#f5a623' },   // amber  — moderate
  { pct: 0.34, color: '#f56565' },   // red    — overloaded
]

export function GaugeDial({ value, label, size = 130, zones = DEFAULT_ZONES }: Props) {
  const cx = size / 2
  const cy = size * 0.62             // push centre down so arc is upper half
  const r  = size * 0.37
  const strokeW = size * 0.078

  // Arc: 180° half-circle (left → right across top)
  // We draw from angle 180° to 360° (left to right)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(startDeg)), y: cy + radius * Math.sin(toRad(startDeg)) }
    const e = { x: cx + radius * Math.cos(toRad(endDeg)),   y: cy + radius * Math.sin(toRad(endDeg)) }
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  // Build zone arcs (180° total)
  const TOTAL_DEG = 180
  const START_DEG = 180
  let zoneArcs: { path: string; color: string }[] = []
  let cursor = 0
  for (const z of zones) {
    const deg = z.pct * TOTAL_DEG
    zoneArcs.push({
      path: arcPath(START_DEG + cursor, START_DEG + cursor + deg, r),
      color: z.color,
    })
    cursor += deg
  }

  // Needle: value 0–100 → angle 180°–360°
  const needleAngle = 180 + (value / 100) * 180
  const needleLen = r - strokeW
  const needleX = cx + needleLen * Math.cos(toRad(needleAngle))
  const needleY = cy + needleLen * Math.sin(toRad(needleAngle))

  // Needle colour based on position
  const needleColor =
    value < 40 ? '#3dd68c' :
    value < 70 ? '#f5a623' : '#f56565'

  const glowId = `gauge-glow-${label.replace(/\s/g,'')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size * 0.72 }}>
        <svg width={size} height={size * 0.72} overflow="visible">
          <defs>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track background */}
          <path
            d={arcPath(180, 360, r)}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* Coloured zone segments */}
          {zoneArcs.map((z, i) => (
            <path
              key={i}
              d={z.path}
              fill="none"
              stroke={z.color}
              strokeWidth={strokeW}
              opacity={0.85}
            />
          ))}

          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={needleColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            style={{ transition: 'x2 0.8s ease, y2 0.8s ease' }}
          />

          {/* Needle pivot */}
          <circle cx={cx} cy={cy} r={4} fill={needleColor} filter={`url(#${glowId})`} />
          <circle cx={cx} cy={cy} r={2} fill="#0d0f11" />
        </svg>
      </div>

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
