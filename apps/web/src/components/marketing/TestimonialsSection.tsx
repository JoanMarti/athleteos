'use client'

export function TestimonialsSection() {
  return (
    <section style={{ padding: '80px 24px' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 48 }}>
        Atletas que lo usan
      </h2>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
        {[
          { quote: 'Por fin entiendo por qué ciertos días rindo mal. El HRV lo explica todo.', name: 'Triatleta amateur, 38 años' },
          { quote: 'La recomendación diaria me ha evitado varias semanas de sobreentrenamiento.', name: 'Ciclista de montaña, 31 años' },
        ].map(t => (
          <div key={t.name} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 12, color: '#00d4a8' }}>"</div>
            <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 16 }}>{t.quote}</p>
            <div style={{ fontSize: 12, color: '#52525b' }}>— {t.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
