'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { PROVIDER_META } from '@athleteos/types'
import type { Provider, ConnectedIntegration } from '@athleteos/types'

const PROVIDER_ORDER: Provider[] = [
  'strava', 'garmin', 'whoop', 'suunto', 'wahoo', 'intervals', 'trainingpeaks', 'polar', 'coros'
]

function ProviderLogo({ provider }: { provider: Provider }) {
  const logos: Partial<Record<Provider, React.ReactNode>> = {
    strava: <svg viewBox="0 0 24 24" fill="#FC4C02" width="20" height="20"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169"/></svg>,
    garmin: <svg viewBox="0 0 24 24" fill="#007CC3" width="20" height="20"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5zm0 2.25A5.25 5.25 0 1 0 12 17.25 5.25 5.25 0 0 0 12 6.75z"/></svg>,
    whoop: <span style={{ fontWeight: 800, fontSize: 13, color: '#00ff87', letterSpacing: '-0.5px' }}>W</span>,
    intervals: <span style={{ fontWeight: 800, fontSize: 11, color: '#7B2D8B', letterSpacing: '-0.5px' }}>ICU</span>,
  }
  return (
    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {logos[provider] ?? <span style={{ fontSize: 11, fontWeight: 700, color: PROVIDER_META[provider].color }}>{PROVIDER_META[provider].label.slice(0, 2).toUpperCase()}</span>}
    </div>
  )
}

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([])
  const [connecting, setConnecting] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    const supabase = createClient()
    const { data } = await supabase
      .from('connected_integrations')
      .select('*')
      .order('created_at', { ascending: true })
    setIntegrations((data as ConnectedIntegration[]) ?? [])
    setLoading(false)
  }

  async function connectProvider(provider: Provider) {
    setConnecting(provider)
    try {
      const meta = PROVIDER_META[provider]

      if (meta.authType === 'apikey') {
        const apiKey = prompt(`Introduce tu API key de ${meta.label}:`)
        if (!apiKey) { setConnecting(null); return }
        const res = await fetch('/api/integrations/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, api_key: apiKey }),
        })
        if (res.ok) await loadIntegrations()
        return
      }

      // OAuth providers
      const res = await fetch(`/api/integrations/${provider}/auth-url`)
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setConnecting(null)
    }
  }

  async function disconnectProvider(provider: Provider) {
    if (!confirm(`¿Desconectar ${PROVIDER_META[provider].label}? Se eliminarán los datos sincronizados.`)) return

    const supabase = createClient()
    await supabase.from('connected_integrations').delete().eq('provider', provider)
    await loadIntegrations()
  }

  async function triggerSync(provider: Provider) {
    await fetch(`/api/integrations/${provider}/sync`, { method: 'POST' })
    await loadIntegrations()
  }

  const connectedMap = new Map(integrations.map(i => [i.provider, i]))

  if (loading) {
    return <div style={{ color: 'var(--txt-2)', fontSize: 14 }}>Cargando integraciones...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Fuentes de datos conectadas</h2>
        <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>
          Conecta tus plataformas para consolidar entrenamiento, recuperación y métricas en un solo lugar.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PROVIDER_ORDER.map(provider => {
          const meta = PROVIDER_META[provider]
          const connected = connectedMap.get(provider)
          const isConnected = !!connected?.is_active

          return (
            <div key={provider} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ProviderLogo provider={provider} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>{meta.label}</span>
                  {meta.status === 'coming_soon' && (
                    <span className="badge badge-muted">Próximamente</span>
                  )}
                  {meta.status === 'beta' && (
                    <span className="badge badge-amber">Beta</span>
                  )}
                  {meta.requiresApproval && !isConnected && (
                    <span className="badge badge-muted" style={{ fontSize: 10 }}>Requiere aprobación</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {meta.supportsActivity   && <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Actividades</span>}
                  {meta.supportsRecovery   && <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Recuperación</span>}
                  {meta.supportsHRV        && <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>HRV</span>}
                </div>

                {isConnected && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--txt-3)' }}>
                    {connected.provider_display_name && <span>@{connected.provider_username} · </span>}
                    {connected.total_activities_synced > 0 && <span>{connected.total_activities_synced} actividades · </span>}
                    {connected.last_sync_at && <span>Sync: {new Date(connected.last_sync_at).toLocaleDateString('es')}</span>}
                    {connected.last_sync_status === 'error' && <span style={{ color: 'var(--red)' }}> · Error de sync</span>}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                {isConnected ? (
                  <>
                    {/* Sync status indicator */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected?.last_sync_status === 'error' ? 'var(--red)' : connected?.last_sync_status === 'syncing' ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }} title={connected?.last_sync_status} />

                    <button onClick={() => triggerSync(provider)} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>
                      Sync
                    </button>
                    <button onClick={() => disconnectProvider(provider)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => connectProvider(provider)}
                    disabled={meta.status === 'coming_soon' || connecting === provider}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 13,
                      borderColor: meta.status === 'available' ? PROVIDER_META[provider].color + '55' : undefined,
                      color: meta.status === 'available' ? 'var(--txt)' : 'var(--txt-3)',
                    }}
                  >
                    {connecting === provider ? 'Conectando...' : 'Conectar'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.6 }}>
        Todos los tokens de acceso se cifran con AES-256-GCM antes de almacenarse. Nunca se comparten con terceros. Puedes revocar el acceso en cualquier momento.
      </div>
    </div>
  )
}
