'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/today',    label: 'Today',    icon: '◎', dot: '#00d4a8' },
  { href: '/week',     label: 'Week',     icon: '▦', dot: '#3dd68c' },
  { href: '/recovery', label: 'Recovery', icon: '◑', dot: '#f5a623' },
  { href: '/activity', label: 'Activity', icon: '◈', dot: '#4299e1' },
  { href: '/profile',  label: 'Profile',  icon: '◉', dot: '#8a8f98' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#0f1113',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '1.75rem', paddingLeft: 4 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--accent)',
          }}>⚡</span>
          AthleteOS
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, paddingLeft: 36 }}>
          MVP v0.1
        </div>
      </div>

      {/* Nav links */}
      {NAV.map(({ href, label, dot }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: active ? dot : 'var(--border-strong)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }} />
            {label}
          </Link>
        )
      })}

      {/* Goal progress */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Active goal
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            FTP +15W
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            42 days remaining
          </div>
          <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '63%', height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
          </div>
          <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>248W now</span>
            <span>263W target</span>
          </div>
        </div>

        {/* Connected accounts status */}
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', padding: '0 2px' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { name: 'Strava', color: '#FC4C02', active: true },
              { name: 'WHOOP', color: '#f0f0f0', active: true },
            ].map(({ name, color, active }) => (
              <div key={name} title={`${name}: ${active ? 'connected' : 'disconnected'}`} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? color : 'var(--text-muted)',
                boxShadow: active ? `0 0 6px ${color}66` : 'none',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>2 sources connected</span>
        </div>
      </div>
    </aside>
  )
}
