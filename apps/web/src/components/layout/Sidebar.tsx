'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDataSources } from '@/hooks/useDataSources'
import { SOURCE_CONFIGS } from '@/lib/dataSources'

const NAV = [
  { href: '/today',    label: 'Today',    dot: '#00d4a8' },
  { href: '/week',     label: 'Week',     dot: '#3dd68c' },
  { href: '/health',   label: 'Health',   dot: '#9f7aea' },
  { href: '/recovery', label: 'Recovery', dot: '#f5a623' },
  { href: '/connect',  label: 'Fuentes',  dot: '#4299e1' },
]

const SOURCES = ['strava', 'fitbit', 'suunto'] as const

export function Sidebar() {
  const pathname = usePathname()
  const { connected, loading, isConnected } = useDataSources()

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
          fontSize: 20, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          display: 'flex', alignItems: 'center', gap: 8,
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
        const isConnect = href === '/connect'
        const hasData = !loading && connected.length > 0
        return (
          <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: active ? dot : isConnect && !hasData ? 'var(--amber)' : 'var(--border-strong)',
              flexShrink: 0,
              boxShadow: isConnect && !hasData && !active ? '0 0 6px var(--amber)' : 'none',
              transition: 'background 0.15s',
            }} />
            {label}
            {isConnect && !loading && connected.length === 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 10,
                background: 'rgba(245,166,35,0.15)',
                color: 'var(--amber)',
                border: '1px solid rgba(245,166,35,0.3)',
              }}>
                Setup
              </span>
            )}
            {isConnect && !loading && connected.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 10,
                background: 'rgba(0,212,168,0.1)',
                color: 'var(--accent)',
                border: '1px solid rgba(0,212,168,0.25)',
              }}>
                {connected.length} ●
              </span>
            )}
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
            Objetivo activo
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            FTP +15W
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            42 días restantes
          </div>
          <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '63%', height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
          </div>
          <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>248W ahora</span>
            <span>263W objetivo</span>
          </div>
        </div>

        {/* Live source status dots */}
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', padding: '0 2px' }}>
          {!loading && (
            <>
              <div style={{ display: 'flex', gap: 4 }}>
                {SOURCES.map(id => {
                  const active = isConnected(id)
                  const color = SOURCE_CONFIGS[id].color
                  return (
                    <div
                      key={id}
                      title={`${SOURCE_CONFIGS[id].name}: ${active ? 'conectado' : 'sin conectar'}`}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: active ? color : 'rgba(255,255,255,0.15)',
                        boxShadow: active ? `0 0 6px ${color}88` : 'none',
                        transition: 'all 0.3s',
                      }}
                    />
                  )
                })}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {connected.length === 0
                  ? 'Sin fuentes'
                  : `${connected.length} fuente${connected.length > 1 ? 's' : ''}`}
              </span>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
