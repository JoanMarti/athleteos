'use client'
import Link from 'next/link'

export function MarketingNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)',
      padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.5px' }}>
        ⚡ AthleteOS
      </span>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/health" style={{
          padding: '8px 18px', borderRadius: 8,
          background: '#00d4a8', color: '#0d0f11',
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>
          Ver demo →
        </Link>
      </div>
    </nav>
  )
}
