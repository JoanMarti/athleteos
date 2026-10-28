'use client'

export function MarketingFooter() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>⚡ AthleteOS</div>
      <div style={{ fontSize: 12, color: '#52525b' }}>
        © {new Date().getFullYear()} AthleteOS · Beta privada · Datos de ejemplo
      </div>
    </footer>
  )
}
