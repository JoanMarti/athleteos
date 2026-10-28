'use client'

const FAQS = [
  { q: '¿Necesito tener los 3 dispositivos?', a: 'No. Puedes conectar solo Fitbit para recuperación, o solo Strava/Suunto para carga. El motor usa lo que tiene disponible.' },
  { q: '¿Es igual que WHOOP?', a: 'Inspirado en WHOOP pero usando tus dispositivos existentes (Fitbit, Strava, Suunto) sin necesidad de comprar hardware nuevo.' },
  { q: '¿Los datos son privados?', a: 'Sí. Los datos se procesan en tu sesión y no se comparten. En beta, los datos de demo son ficticios.' },
]

export function FaqSection() {
  return (
    <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 48 }}>
        Preguntas frecuentes
      </h2>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FAQS.map(f => (
          <div key={f.q} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>{f.q}</div>
            <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
