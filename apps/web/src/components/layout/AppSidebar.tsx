'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

const NAV = [
  { href: '/app',           label: 'Hoy',         iconD: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z', dot: 'var(--accent)' },
  { href: '/app/week',      label: 'Semana',       iconD: 'M7 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-2V1h-2v2H9V1H7v2zm12 16H5V8h14v11zM7 10h5v5H7z', dot: 'var(--green)' },
  { href: '/app/recovery',  label: 'Recuperación', iconD: 'M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z', dot: 'var(--amber)' },
  { href: '/app/activities',label: 'Actividades',  iconD: 'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z', dot: 'var(--blue)' },
  { href: '/app/profile',   label: 'Perfil',       iconD: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z', dot: 'var(--txt-3)' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { profile, athleteProfile, signOut } = useAuthStore()

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar" style={{
        background: 'rgba(8,10,14,0.95)',
        borderRight: '1px solid var(--border)',
        padding: '1.25rem 0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {/* Logo */}
        <div style={{ padding: '0.25rem 0.5rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>⚡</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--txt)', letterSpacing: '-0.3px' }}>AthleteOS</span>
          </div>
        </div>

        {/* Nav */}
        {NAV.map(({ href, label, iconD, dot }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: active ? 500 : 400,
              color: active ? 'var(--txt)' : 'var(--txt-2)',
              textDecoration: 'none',
              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: active ? '1px solid var(--border-md)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? dot : 'var(--border-md)', flexShrink: 0, transition: 'background 0.15s' }} />
              {label}
            </Link>
          )
        })}

        {/* User profile at bottom */}
        <div style={{ marginTop: 'auto' }}>
          {/* Goal progress */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Objetivo activo</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
              {athleteProfile?.ftp_watts ? `FTP ${athleteProfile.ftp_watts}W` : 'Sin objetivo definido'}
            </div>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: '63%', height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
            </div>
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--txt-2)', flexShrink: 0, overflow: 'hidden' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile?.full_name?.[0] ?? '?').toUpperCase()
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'Atleta'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {athleteProfile?.primary_sport ?? 'Sin configurar'}
              </div>
            </div>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }} title="Cerrar sesión">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,10,14,0.96)',
        borderTop: '1px solid var(--border)',
        padding: '6px 0 8px',
      }} className="mobile-nav">
        {NAV.map(({ href, label, iconD, dot }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 8px', flex: 1,
              color: active ? 'var(--accent)' : 'var(--txt-3)',
              textDecoration: 'none', fontSize: 10, fontWeight: 500, transition: 'color 0.15s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="1.5">
                <path d={iconD} />
              </svg>
              {label}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  )
}
