'use client'

const STATS = [
  { value: '3', label: 'fuentes integradas', sub: 'Fitbit · Strava · Suunto' },
  { value: '4', label: 'métricas de recuperación', sub: 'HRV · Sueño · FC · SpO₂' },
  { value: '14', label: 'noches de tendencia HRV', sub: 'Algoritmo Plews 2013' },
  { value: '∞', label: 'días de historial de carga', sub: 'Modelo ATL/CTL Banister' },
]

export function StatsRow() {
  return (
    <section style={{
      padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 32, textAlign: 'center' }}>
        {STATS.map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#00d4a8', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 14, color: '#f4f4f5', fontWeight: 600, marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
