'use client'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function PersonalInfoPanel() {
  const { profile, updateProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    country: profile?.country ?? '',
    timezone: profile?.timezone ?? 'Europe/Madrid',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const TIMEZONES = [
    'Europe/Madrid', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
    'America/Chicago', 'America/Sao_Paulo', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland',
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Información personal</h2>
        <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>Tus datos de perfil público.</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Nombre completo</label>
                <input className="input" type="text" value={form.full_name} onChange={set('full_name')} placeholder="Alex García" />
              </div>
              <div>
                <label className="label">Nombre de usuario</label>
                <input className="input" type="text" value={form.username} onChange={set('username')} placeholder="alex_runner" />
              </div>
            </div>

            <div>
              <label className="label">Biografía</label>
              <textarea
                className="input"
                rows={3}
                value={form.bio}
                onChange={set('bio') as any}
                placeholder="Triatleta aficionado, amante del ciclismo de montaña..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">País</label>
                <input className="input" type="text" value={form.country} onChange={set('country')} placeholder="España" />
              </div>
              <div>
                <label className="label">Zona horaria</label>
                <select className="input" value={form.timezone} onChange={set('timezone')} style={{ cursor: 'pointer' }}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '12px 28px' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Guardado</span>}
          </div>
        </div>
      </form>
    </div>
  )
}
