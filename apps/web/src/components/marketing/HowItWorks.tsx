'use client'

const STEPS = [
  { n: '01', title: 'Conecta tus dispositivos', desc: 'Fitbit para sueño y HRV. Strava para actividades. Suunto para efecto de entrenamiento.' },
  { n: '02', title: 'El motor analiza tu estado', desc: 'Cada mañana calcula tu score de recuperación, compara tu HRV con tu baseline y evalúa tu carga.' },
  { n: '03', title: 'Recibe tu recomendación', desc: 'Una sola instrucción clara: qué hacer hoy según cómo estás de verdad — no según el plan.' },
]

export function HowItWorks() {
  return (
    <section style={{ padding: '80px 24px' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 56 }}>
        Cómo funciona
      </h2>
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: 'rgba(0,212,168,0.1)', border: '1px solid rgba(0,212,168,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: '#00d4a8',
            }}>{s.n}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f5', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
