'use client'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          background: 'rgba(0,212,168,0.1)', border: '1px solid rgba(0,212,168,0.25)',
          fontSize: 12, color: '#00d4a8', fontWeight: 600, marginBottom: 28, letterSpacing: '0.05em',
        }}>
          WHOOP-STYLE · FITBIT · STRAVA · SUUNTO
        </div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800, color: '#f4f4f5', lineHeight: 1.05, letterSpacing: '-1.5px', margin: '0 0 24px',
        }}>
          Todos tus datos deportivos.<br />
          <span style={{ color: '#00d4a8' }}>Una sola inteligencia.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
          Unifica Fitbit, Strava y Suunto en un motor de recuperación que te dice
          exactamente cómo estás hoy — y qué deberías entrenar mañana.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/health" style={{
            padding: '14px 32px', borderRadius: 10,
            background: '#00d4a8', color: '#0d0f11',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 0 32px rgba(0,212,168,0.35)',
          }}>
            Ver dashboard de salud →
          </Link>
          <Link href="/today" style={{
            padding: '14px 32px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', color: '#f4f4f5',
            border: '1px solid rgba(255,255,255,0.12)',
            fontWeight: 600, fontSize: 15, textDecoration: 'none',
          }}>
            Explorar app
          </Link>
        </div>
      </div>
    </section>
  )
}
