'use client'
import Link from 'next/link'

export function DashboardPreview() {
  return (
    <section style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: '#f4f4f5', marginBottom: 16 }}>
        Dashboard de recuperación
      </h2>
      <p style={{ color: '#a1a1aa', fontSize: 15, marginBottom: 40 }}>
        4 esferas al estilo WHOOP · HRV · Sueño · Carga de entrenamiento
      </p>
      <div style={{
        maxWidth: 800, margin: '0 auto',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '48px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{ fontSize: 64 }}>📊</div>
        <p style={{ color: '#71717a', fontSize: 14 }}>
          Recuperación · HRV · Sueño · Carga ATL/CTL
        </p>
        <Link href="/health" style={{
          padding: '12px 28px', borderRadius: 8, textDecoration: 'none',
          background: '#00d4a8', color: '#0d0f11', fontWeight: 700, fontSize: 14,
        }}>
          Abrir dashboard en vivo →
        </Link>
      </div>
    </section>
  )
}
