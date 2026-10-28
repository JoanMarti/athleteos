'use client'

const FEATURES = [
  { icon: '💚', title: 'HRV & Recuperación', desc: 'Score diario basado en HRV nocturno de Fitbit comparado con tu baseline personal (Plews 2013).' },
  { icon: '🌙', title: 'Arquitectura del sueño', desc: 'Deep + REM + Light desglosados noche a noche. Deuda de sueño acumulada en 7 días.' },
  { icon: '⚡', title: 'Carga ATL/CTL', desc: 'Modelo de Banister: Fatigue, Fitness y Form (TSB) calculados a partir de Strava y Suunto.' },
  { icon: '🎯', title: 'Recomendación diaria', desc: 'Entrena fuerte · Entrenamiento moderado · Recuperación activa · Descanso total — según tu estado real.' },
  { icon: '🏊', title: 'Multi-deporte', desc: 'Ciclismo, running, natación, triatlón. Actividades de Strava y Suunto unificadas en un solo historial.' },
  { icon: '📈', title: 'Tendencias HRV', desc: '14 noches de tendencia con indicador rising/stable/declining y delta vs. baseline.' },
]

export function FeaturesGrid() {
  return (
    <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 48 }}>
        Todo lo que necesitas
      </h2>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 20 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{
            padding: '24px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
