'use client'

export function PricingSection() {
  return (
    <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#f4f4f5', marginBottom: 12 }}>
        Precio
      </h2>
      <p style={{ color: '#a1a1aa', marginBottom: 40 }}>Actualmente en beta privada — acceso gratuito</p>
      <div style={{
        maxWidth: 360, margin: '0 auto', padding: '32px',
        background: 'rgba(0,212,168,0.05)', border: '1px solid rgba(0,212,168,0.2)',
        borderRadius: 16,
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color: '#00d4a8' }}>€0</div>
        <div style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>durante la beta</div>
        {['Dashboard de recuperación', 'HRV + sueño (Fitbit)', 'Carga ATL/CTL (Strava + Suunto)', 'Recomendación diaria', 'Historial 14 días'].map(f => (
          <div key={f} style={{ fontSize: 13, color: '#a1a1aa', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            ✓ {f}
          </div>
        ))}
      </div>
    </section>
  )
}
