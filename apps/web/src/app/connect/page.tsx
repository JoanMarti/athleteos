'use client'
import { useState } from 'react'
import { useDataSources } from '@/hooks/useDataSources'
import { SOURCE_CONFIGS, type SourceId } from '@/lib/dataSources'

const SOURCES: SourceId[] = ['strava', 'fitbit', 'suunto']

const SOURCE_DETAILS: Record<SourceId, { description: string; metrics: string[] }> = {
  strava: {
    description: 'Actividades de running, ciclismo y triatlón. Potencia, pace, zonas HR.',
    metrics: ['Actividades GPS', 'Datos de potencia', 'Segmentos y KOMs', 'Zonas de HR'],
  },
  fitbit: {
    description: 'Sueño, HRV, frecuencia cardíaca en reposo y pasos diarios.',
    metrics: ['HRV nocturno', 'Sueño por fases', 'HR en reposo', 'Pasos y calorías'],
  },
  suunto: {
    description: 'Entrenos de natación, trail y montaña. GPS preciso en outdoor.',
    metrics: ['Natación', 'Trail running', 'Métricas de altitud', 'GPS de alta precisión'],
  },
}

function SourceCard({ id, onConnect, onDisconnect, isConnected, loading }: {
  id: SourceId
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
  loading: boolean
}) {
  const cfg = SOURCE_CONFIGS[id]
  const details = SOURCE_DETAILS[id]
  const [confirming, setConfirming] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isConnected ? cfg.color + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'border-color 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent glow when connected */}
      {isConnected && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: cfg.color,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: cfg.color + '18',
            border: `1.5px solid ${cfg.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {cfg.logo}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {cfg.name}
            </div>
            {isConnected && (
              <div style={{
                fontSize: 11, color: cfg.color, fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: cfg.color, display: 'inline-block',
                  boxShadow: `0 0 6px ${cfg.color}`,
                }} />
                CONECTADO
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        {!loading && (
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: isConnected ? cfg.color + '18' : 'rgba(255,255,255,0.04)',
            color: isConnected ? cfg.color : 'var(--text-muted)',
            border: `1px solid ${isConnected ? cfg.color + '44' : 'var(--border)'}`,
            fontFamily: 'var(--font-mono)',
          }}>
            {isConnected ? '● Activo' : '○ Sin conectar'}
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
        {details.description}
      </p>

      {/* Metrics chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {details.metrics.map(m => (
          <span key={m} style={{
            fontSize: 11, padding: '3px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            color: 'var(--text-muted)',
          }}>
            {m}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 4 }}>
        {isConnected ? (
          confirming ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onDisconnect(); setConfirming(false) }}
                style={{
                  flex: 1, padding: '10px',
                  background: 'rgba(245,101,101,0.12)',
                  color: 'var(--red)',
                  border: '1px solid rgba(245,101,101,0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}>
                Sí, desconectar
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}>
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}>
              Desconectar
            </button>
          )
        ) : (
          <button
            onClick={onConnect}
            style={{
              width: '100%', padding: '11px',
              background: cfg.color,
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'opacity 0.15s',
              letterSpacing: '0.02em',
            }}>
            Conectar {cfg.name} →
          </button>
        )}
      </div>
    </div>
  )
}

export default function ConnectPage() {
  const { connected, loading, connect, disconnect, isConnected } = useDataSources()

  const connectedCount = connected.length

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 6px', letterSpacing: '-0.5px',
        }}>
          Fuentes de datos
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
          Conecta tus dispositivos y plataformas para ver datos reales en tu dashboard.
        </p>
      </div>

      {/* Status bar */}
      {!loading && (
        <div className="animate-fade-up" style={{
          background: connectedCount > 0 ? 'rgba(0,212,168,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${connectedCount > 0 ? 'rgba(0,212,168,0.2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connectedCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
            boxShadow: connectedCount > 0 ? '0 0 8px var(--accent)' : 'none',
          }} />
          <span style={{ fontSize: 13, color: connectedCount > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
            {connectedCount === 0
              ? 'Sin fuentes conectadas — los dashboards muestran datos de ejemplo'
              : `${connectedCount} fuente${connectedCount > 1 ? 's' : ''} conectada${connectedCount > 1 ? 's' : ''} — tus datos reales están activos`}
          </span>
        </div>
      )}

      {/* Source cards */}
      <div className="animate-fade-up delay-1" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {SOURCES.map(id => (
          <SourceCard
            key={id}
            id={id}
            isConnected={isConnected(id)}
            loading={loading}
            onConnect={() => connect(id)}
            onDisconnect={() => disconnect(id)}
          />
        ))}
      </div>

      {/* Info section */}
      <div className="animate-fade-up delay-2" style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 10,
        }}>
          Privacidad y seguridad
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            ['🔐', 'Tokens guardados solo en tu navegador', 'Nada se envía a ningún servidor externo'],
            ['👁', 'Solo lectura', 'AthleteOS nunca modifica ni borra tus datos en Strava o Fitbit'],
            ['🗑', 'Desconecta cuando quieras', 'Elimina el acceso con un clic — también desde la app oficial'],
            ['🌐', 'Open source', 'El código es público en github.com/JoanMarti/athleteos'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup guide */}
      <div className="animate-fade-up delay-3" style={{
        marginTop: '1.5rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 10,
        }}>
          ¿Primera vez? Necesitas configurar las apps de OAuth
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
          Para conectar con Strava o Fitbit necesitas registrar AthleteOS como app OAuth en sus portales de desarrollador
          y añadir los Client IDs como variables de entorno en GitHub Actions.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Strava Developer', url: 'https://www.strava.com/settings/api' },
            { label: 'Fitbit Developer', url: 'https://dev.fitbit.com/apps/new' },
            { label: 'Suunto App Sport', url: 'https://www.suunto.com/en-us/sports-tracker/download-app/' },
          ].map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 12, padding: '6px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
