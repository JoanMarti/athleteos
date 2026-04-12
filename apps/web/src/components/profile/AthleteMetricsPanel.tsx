'use client'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { calculateHRZones, calculatePowerZones } from '@athleteos/utils'

const SPORT_OPTS = [
  { v: 'cycling',   l: 'Ciclismo' },
  { v: 'running',   l: 'Running' },
  { v: 'triathlon', l: 'Triatlón' },
  { v: 'swimming',  l: 'Natación' },
  { v: 'fitness',   l: 'Fitness / Endurance' },
]
const LEVEL_OPTS = [
  { v: 'beginner',     l: 'Principiante' },
  { v: 'intermediate', l: 'Intermedio' },
  { v: 'advanced',     l: 'Avanzado' },
  { v: 'elite',        l: 'Élite' },
]

function ZoneRow({ zone, range, unit }: { zone: string; range: [number, number]; unit: string }) {
  const colors: Record<string, string> = { z1: '#60a5fa', z2: '#4ade80', z3: '#fbbf24', z4: '#f87171', z5: '#e879f9', z6: '#c084fc' }
  const labels: Record<string, string> = { z1: 'Z1 Recuperación', z2: 'Z2 Aeróbico', z3: 'Z3 Tempo', z4: 'Z4 Umbral', z5: 'Z5 VO2max', z6: 'Z6 Anaeróbico' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[zone], flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--txt-2)', flex: 1 }}>{labels[zone]}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--txt)' }}>
        {range[0]} – {range[1] > 9000 ? '∞' : range[1]} {unit}
      </span>
    </div>
  )
}

export function AthleteMetricsPanel() {
  const { athleteProfile, updateAthleteProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    primary_sport: athleteProfile?.primary_sport ?? 'cycling',
    experience_level: athleteProfile?.experience_level ?? 'intermediate',
    weight_kg: athleteProfile?.weight_kg?.toString() ?? '',
    height_cm: athleteProfile?.height_cm?.toString() ?? '',
    date_of_birth: athleteProfile?.date_of_birth ?? '',
    gender: athleteProfile?.gender ?? '',
    // Cycling
    ftp_watts: athleteProfile?.ftp_watts?.toString() ?? '',
    max_aerobic_power_watts: athleteProfile?.max_aerobic_power_watts?.toString() ?? '',
    w_prime_joules: athleteProfile?.w_prime_joules?.toString() ?? '',
    // Running
    lthr_bpm: athleteProfile?.lthr_bpm?.toString() ?? '',
    threshold_pace_sec_km: athleteProfile?.threshold_pace_sec_km?.toString() ?? '',
    // HR
    max_hr_bpm: athleteProfile?.max_hr_bpm?.toString() ?? '',
    resting_hr_bpm: athleteProfile?.resting_hr_bpm?.toString() ?? '',
    // Targets
    weekly_training_hours_target: athleteProfile?.weekly_training_hours_target?.toString() ?? '8',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const ftp = parseInt(form.ftp_watts) || 0
  const lthr = parseInt(form.lthr_bpm) || 0
  const maxHR = parseInt(form.max_hr_bpm) || 0

  const powerZones = ftp > 0 ? calculatePowerZones(ftp) : null
  const hrZones = lthr > 0 ? calculateHRZones(lthr) : (maxHR > 0 ? calculateHRZones(Math.round(maxHR * 0.92)) : null)

  async function handleSave() {
    setSaving(true)
    const numOrUndef = (s: string) => s ? parseFloat(s) : undefined
    const intOrUndef = (s: string) => s ? parseInt(s) : undefined

    await updateAthleteProfile({
      primary_sport: form.primary_sport as any,
      experience_level: form.experience_level as any,
      weight_kg: numOrUndef(form.weight_kg),
      height_cm: numOrUndef(form.height_cm),
      date_of_birth: form.date_of_birth || undefined,
      gender: form.gender || undefined,
      ftp_watts: intOrUndef(form.ftp_watts),
      max_aerobic_power_watts: intOrUndef(form.max_aerobic_power_watts),
      w_prime_joules: intOrUndef(form.w_prime_joules),
      lthr_bpm: intOrUndef(form.lthr_bpm),
      threshold_pace_sec_km: numOrUndef(form.threshold_pace_sec_km),
      max_hr_bpm: intOrUndef(form.max_hr_bpm),
      resting_hr_bpm: intOrUndef(form.resting_hr_bpm),
      weekly_training_hours_target: parseFloat(form.weekly_training_hours_target) || 8,
      // Auto-calc zones
      power_zones: powerZones ?? undefined,
      hr_zones: hrZones ?? undefined,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>Métricas del atleta</h2>
        <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>Tus datos físicos y de rendimiento. Las zonas se calculan automáticamente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Deporte y nivel</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label">Deporte principal</label>
                <select className="input" value={form.primary_sport} onChange={set('primary_sport')} style={{ cursor: 'pointer' }}>
                  {SPORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nivel</label>
                <select className="input" value={form.experience_level} onChange={set('experience_level')} style={{ cursor: 'pointer' }}>
                  {LEVEL_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Horas de entrenamiento / semana</label>
              <input className="input" type="number" min="1" max="40" step="0.5" value={form.weekly_training_hours_target} onChange={set('weekly_training_hours_target')} />
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Datos físicos</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label">Peso (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="72.5" value={form.weight_kg} onChange={set('weight_kg')} />
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input className="input" type="number" step="0.5" placeholder="178" value={form.height_cm} onChange={set('height_cm')} />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input className="input" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              </div>
              <div>
                <label className="label">Género</label>
                <select className="input" value={form.gender} onChange={set('gender') as any} style={{ cursor: 'pointer' }}>
                  <option value="">Sin especificar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="non_binary">No binario</option>
                  <option value="prefer_not">Prefiero no decir</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Frecuencia cardíaca</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
              <div>
                <label className="label">FC máxima (bpm)</label>
                <input className="input" type="number" placeholder="185" value={form.max_hr_bpm} onChange={set('max_hr_bpm')} />
              </div>
              <div>
                <label className="label">FC reposo (bpm)</label>
                <input className="input" type="number" placeholder="48" value={form.resting_hr_bpm} onChange={set('resting_hr_bpm')} />
              </div>
              <div>
                <label className="label">LTHR - FC umbral (bpm)</label>
                <input className="input" type="number" placeholder="168" value={form.lthr_bpm} onChange={set('lthr_bpm')} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 8 }}>Si introduces el LTHR, las zonas se calcularán con Friel 5z. Si solo tienes FC máx, se estimará el umbral al 92%.</p>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Ciclismo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">FTP (vatios)</label>
                <input className="input" type="number" placeholder="248" value={form.ftp_watts} onChange={set('ftp_watts')} />
              </div>
              <div>
                <label className="label">Potencia aeróbica máx (W)</label>
                <input className="input" type="number" placeholder="380" value={form.max_aerobic_power_watts} onChange={set('max_aerobic_power_watts')} />
              </div>
              <div>
                <label className="label">W' — Capacidad anaeróbica (J)</label>
                <input className="input" type="number" placeholder="20000" value={form.w_prime_joules} onChange={set('w_prime_joules')} />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Running</div>
            <div>
              <label className="label">Ritmo de umbral (seg/km)</label>
              <input className="input" type="number" placeholder="240 (= 4:00/km)" value={form.threshold_pace_sec_km} onChange={set('threshold_pace_sec_km')} />
              {form.threshold_pace_sec_km && (
                <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
                  = {Math.floor(parseInt(form.threshold_pace_sec_km) / 60)}:{String(parseInt(form.threshold_pace_sec_km) % 60).padStart(2, '0')} min/km
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column — auto-calculated zones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Power zones */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zonas de potencia</div>
              {ftp > 0 && <span className="badge badge-accent">FTP {ftp}W</span>}
            </div>
            {powerZones ? (
              <>
                {(Object.entries(powerZones) as [string, [number, number]][]).map(([z, r]) => (
                  <ZoneRow key={z} zone={z} range={r} unit="W" />
                ))}
                <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 8 }}>Zonas Coggan basadas en FTP. Se recalculan automáticamente al guardar.</p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--txt-3)', fontSize: 13 }}>
                Introduce tu FTP para calcular las zonas de potencia
              </div>
            )}
          </div>

          {/* HR zones */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zonas de FC</div>
              {(lthr > 0 || maxHR > 0) && <span className="badge badge-green">{lthr > 0 ? `LTHR ${lthr}bpm` : `FCmax ${maxHR}bpm`}</span>}
            </div>
            {hrZones ? (
              <>
                {(Object.entries(hrZones) as [string, [number, number]][]).map(([z, r]) => (
                  <ZoneRow key={z} zone={z} range={r} unit="bpm" />
                ))}
                <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 8 }}>
                  {lthr > 0 ? 'Modelo Friel 5 zonas basado en LTHR.' : 'LTHR estimado al 92% de FC máx. Introduce tu LTHR para mayor precisión.'}
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--txt-3)', fontSize: 13 }}>
                Introduce FC máxima o LTHR para calcular las zonas
              </div>
            )}
          </div>

          {/* Summary card */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Resumen del atleta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { l: 'Deporte', v: SPORT_OPTS.find(o => o.v === form.primary_sport)?.l },
                { l: 'Nivel', v: LEVEL_OPTS.find(o => o.v === form.experience_level)?.l },
                { l: 'Peso', v: form.weight_kg ? `${form.weight_kg} kg` : '—' },
                { l: 'FTP', v: ftp ? `${ftp} W` : '—' },
                { l: 'W/kg', v: ftp && form.weight_kg ? `${(ftp / parseFloat(form.weight_kg)).toFixed(2)} W/kg` : '—' },
                { l: 'FC máx', v: form.max_hr_bpm ? `${form.max_hr_bpm} bpm` : '—' },
                { l: 'Objetivo semanal', v: `${form.weekly_training_hours_target}h` },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--txt-2)' }}>{l}</span>
                  <span style={{ color: 'var(--txt)', fontFamily: v && v !== '—' ? 'var(--font-mono)' : undefined }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
          {saving ? 'Guardando...' : 'Guardar métricas'}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Guardado</span>}
      </div>
    </div>
  )
}
