'use client'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { IntegrationsPanel } from '@/components/profile/IntegrationsPanel'
import { AthleteMetricsPanel } from '@/components/profile/AthleteMetricsPanel'
import { PersonalInfoPanel } from '@/components/profile/PersonalInfoPanel'

type Tab = 'personal' | 'metrics' | 'integrations' | 'goals'

export default function ProfilePage() {
  const { profile, athleteProfile } = useAuthStore()
  const [tab, setTab] = useState<Tab>('personal')

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: 'personal',     label: 'Información' },
    { id: 'metrics',      label: 'Métricas' },
    { id: 'integrations', label: 'Integraciones' },
    { id: 'goals',        label: 'Objetivos' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          {/* Avatar */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, overflow: 'hidden' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile?.full_name?.[0] ?? '?').toUpperCase()
            }
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', margin: 0, letterSpacing: '-0.3px' }}>
              {profile?.full_name ?? 'Mi perfil'}
            </h1>
            <p style={{ color: 'var(--txt-2)', fontSize: 14, margin: '3px 0 0' }}>
              {athleteProfile?.primary_sport ?? 'Deporte sin configurar'} · {athleteProfile?.experience_level ?? 'Nivel sin configurar'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 16px', borderRadius: 7,
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--txt)' : 'var(--txt-2)',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              border: tab === t.id ? '1px solid var(--border-md)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {t.badge && (
                <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className="animate-in delay-1">
        {tab === 'personal'     && <PersonalInfoPanel />}
        {tab === 'metrics'      && <AthleteMetricsPanel />}
        {tab === 'integrations' && <IntegrationsPanel />}
        {tab === 'goals'        && <GoalsPanel />}
      </div>
    </div>
  )
}

// ─── Goals Panel (inline for simplicity) ─────────────────────
function GoalsPanel() {
  const { athleteProfile } = useAuthStore()

  const GOAL_TYPES = [
    { type: 'ftp_improvement',  label: 'Mejorar FTP',            emoji: '⚡', metric: 'FTP target (W)' },
    { type: 'race_preparation', label: 'Preparar carrera',        emoji: '🏁', metric: 'Fecha objetivo' },
    { type: 'time_goal',        label: 'Tiempo en prueba',        emoji: '⏱', metric: 'Tiempo objetivo' },
    { type: 'endurance_base',   label: 'Base aeróbica',          emoji: '🫀', metric: 'Horas semanales' },
    { type: 'weight_loss',      label: 'Perder grasa (rendimiento)', emoji: '⚖', metric: 'Peso objetivo (kg)' },
    { type: 'vo2max',           label: 'Mejorar VO2max',          emoji: '📈', metric: 'VO2max objetivo' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Objetivos deportivos</h2>
        <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>Define tu objetivo principal. El motor de recomendaciones se adaptará.</p>
      </div>
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {GOAL_TYPES.map(g => (
          <div key={g.type} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s', padding: '1.25rem' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{g.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>{g.label}</div>
            <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>{g.metric}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ padding: '12px 28px' }}>Guardar objetivo</button>
    </div>
  )
}
