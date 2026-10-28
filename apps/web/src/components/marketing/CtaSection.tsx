'use client'
import Link from 'next/link'

export function CtaSection() {
  return (
    <section style={{ padding: '100px 24px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-1px', marginBottom: 20 }}>
        ¿Listo para entrenar<br />con inteligencia?
      </h2>
      <p style={{ color: '#71717a', fontSize: 15, marginBottom: 36 }}>
        Explora el dashboard de recuperación con datos de ejemplo
      </p>
      <Link href="/health" style={{
        padding: '16px 40px', borderRadius: 10, textDecoration: 'none',
        background: '#00d4a8', color: '#0d0f11', fontWeight: 800, fontSize: 16,
        boxShadow: '0 0 48px rgba(0,212,168,0.4)',
        display: 'inline-block',
      }}>
        Abrir AthleteOS →
      </Link>
    </section>
  )
}
