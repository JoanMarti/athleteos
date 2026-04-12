'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase'
import { calculateHRZones, calculatePowerZones } from '@athleteos/utils'

const STEPS = ['Deporte', 'Nivel', 'Métricas', 'Objetivo', 'Conectar']

export default function OnboardingPage() {
  const router = useRouter()
  const { user, updateAthleteProfile, updateProfile, refreshProfile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState({
    primary_sport: 'cycling',
    experience_level: 'intermediate',
    ftp_watts: '',
    max_hr_bpm: '',
    weight_kg: '',
    weekly_training_hours_target: '8',
    goal_type: 'ftp_improvement',
    goal_title: 'Mejorar FTP',
  })

  function set(field: keyof typeof data) {
    return (v: string) => setData(prev => ({ ...prev, [field]: v }))
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()

    const ftp = parseInt(data.ftp_watts) || undefined
    const maxHR = parseInt(data.max_hr_bpm) || undefined

    await updateAthleteProfile({
      primary_sport: data.primary_sport as any,
      experience_level: data.experience_level as any,
      ftp_watts: ftp,
      max_hr_bpm: maxHR,
      weight_kg: parseFloat(data.weight_kg) || undefined,
      weekly_training_hours_target: parseFloat(data.weekly_training_hours_target) || 8,
      power_zones: ftp ? calculatePowerZones(ftp) : undefined,
      hr_zones: maxHR ? calculateHRZones(Math.round(maxHR * 0.92)) : undefined,
    })

    if (data.goal_type) {
      await supabase.from('goals').insert({
        user_id: user!.id,
        type: data.goal_type,
        title: data.goal_title,
        is_primary: true,
        status: 'active',
      })
    }

    await updateProfile({ onboarding_done: true })
    setSaving(false)
    router.push('/app')
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent)' }}>⚡</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>AthleteOS</span>
          </div>

          {/* Progress */}
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <span key={s} style={{ fontSize: 11, color: i <= step ? 'var(--accent)' : 'var(--txt-3)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Step 0: Sport */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, letterSpacing: '-0.3px' }}>¿Cuál es tu deporte principal?</h2>
              <p style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: '1.5rem' }}>Las recomendaciones se adaptarán a tu disciplina.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { v: 'cycling', l: 'Ciclismo', e: '🚴' },
                  { v: 'running', l: 'Running', e: '🏃' },
                  { v: 'triathlon', l: 'Triatlón', e: '🏅' },
                  { v: 'swimming', l: 'Natación', e: '🏊' },
                  { v: 'fitness', l: 'Fitness / Endurance', e: '💪' },
                  { v: 'other', l: 'Otro', e: '🏋️' },
                ].map(({ v, l, e }) => (
                  <button key={v} onClick={() => set('primary_sport')(v)} style={{ padding: '14px', borderRadius: 'var(--r-md)', background: data.primary_sport === v ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${data.primary_sport === v ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', color: data.primary_sport === v ? 'var(--accent)' : 'var(--txt-2)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 20 }}>{e}</span>{l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Level */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, letterSpacing: '-0.3px' }}>¿Cuál es tu nivel?</h2>
              <p style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: '1.5rem' }}>Esto ajusta la intensidad y volumen de las recomendaciones.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { v: 'beginner', l: 'Principiante', d: 'Menos de 1 año entrenando de forma estructurada' },
                  { v: 'intermediate', l: 'Intermedio', d: '1-3 años, 5-8h semanales, sin competición' },
                  { v: 'advanced', l: 'Avanzado', d: '3+ años, 8-14h semanales, competición amateur' },
                  { v: 'elite', l: 'Élite', d: 'Más de 14h semanales, competición de alto nivel' },
                ].map(({ v, l, d }) => (
                  <button key={v} onClick={() => set('experience_level')(v)} style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: data.experience_level === v ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${data.experience_level === v ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: data.experience_level === v ? 'var(--accent)' : 'var(--txt)', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>{d}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Metrics */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, letterSpacing: '-0.3px' }}>Tus métricas de rendimiento</h2>
              <p style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: '1.5rem' }}>Opcional pero recomendado. Puedes editar esto más tarde en tu perfil.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.primary_sport === 'cycling' || data.primary_sport === 'triathlon' ? (
                  <div>
                    <label className="label">FTP — Umbral de potencia funcional (W)</label>
                    <input className="input" type="number" placeholder="Ej: 248" value={data.ftp_watts} onChange={e => set('ftp_watts')(e.target.value)} />
                    <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 5 }}>Si no lo sabes, puedes dejarlo en blanco y añadirlo después de hacer un test.</p>
                  </div>
                ) : null}
                <div>
                  <label className="label">FC máxima (bpm)</label>
                  <input className="input" type="number" placeholder="Ej: 185" value={data.max_hr_bpm} onChange={e => set('max_hr_bpm')(e.target.value)} />
                </div>
                <div>
                  <label className="label">Peso corporal (kg)</label>
                  <input className="input" type="number" step="0.1" placeholder="Ej: 72.5" value={data.weight_kg} onChange={e => set('weight_kg')(e.target.value)} />
                </div>
                <div>
                  <label className="label">Horas de entrenamiento objetivo / semana</label>
                  <input className="input" type="number" min="1" max="40" step="0.5" value={data.weekly_training_hours_target} onChange={e => set('weekly_training_hours_target')(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, letterSpacing: '-0.3px' }}>¿Cuál es tu objetivo principal?</h2>
              <p style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: '1.5rem' }}>El motor de recomendaciones se adaptará a este objetivo.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { v: 'ftp_improvement', l: 'Mejorar FTP / potencia', e: '⚡' },
                  { v: 'race_preparation', l: 'Preparar una carrera o prueba', e: '🏁' },
                  { v: 'endurance_base', l: 'Construir base aeróbica', e: '🫀' },
                  { v: 'time_goal', l: 'Bajar tiempo en una distancia', e: '⏱' },
                  { v: 'weight_loss', l: 'Perder grasa manteniendo rendimiento', e: '⚖' },
                  { v: 'vo2max', l: 'Mejorar VO2max', e: '📈' },
                  { v: 'general_fitness', l: 'Mejorar condición general', e: '💪' },
                ].map(({ v, l, e }) => (
                  <button key={v} onClick={() => { set('goal_type')(v); set('goal_title')(l) }} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: data.goal_type === v ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: `1px solid ${data.goal_type === v ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', color: data.goal_type === v ? 'var(--accent)' : 'var(--txt-2)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 18 }}>{e}</span>{l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Connect */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, letterSpacing: '-0.3px' }}>Conecta tus fuentes de datos</h2>
              <p style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: '1.5rem' }}>Puedes conectar todo desde tu perfil después. Al menos conecta Strava para empezar.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
                {[
                  { provider: 'strava', label: 'Strava', color: '#FC4C02', desc: 'Actividades, potencia, ritmo, zonas', recommended: true },
                  { provider: 'whoop', label: 'WHOOP', color: '#00ff87', desc: 'HRV, recovery score, sueño' },
                  { provider: 'garmin', label: 'Garmin Connect', color: '#007CC3', desc: 'Actividades + wellness completo' },
                ].map(({ provider, label, color, desc, recommended }) => (
                  <button key={provider} onClick={() => window.location.href = `/api/integrations/${provider}/auth-url`} style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: `1px solid ${color}44`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {label}
                        {recommended && <span className="badge badge-accent" style={{ fontSize: 9 }}>Recomendado</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 1 }}>{desc}</div>
                    </div>
                    <span style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--txt-3)', textAlign: 'center' }}>
                También puedes conectar Suunto, Wahoo, Intervals.icu y TrainingPeaks desde tu perfil.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} className="btn btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
            ← Atrás
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" style={{ padding: '11px 28px' }}>
              Continuar →
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="btn btn-primary" style={{ padding: '11px 28px' }}>
              {saving ? 'Configurando...' : '¡Empezar! →'}
            </button>
          )}
        </div>

        {step === STEPS.length - 1 && (
          <button onClick={finish} disabled={saving} style={{ display: 'block', width: '100%', marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', fontSize: 13 }}>
            Saltar y configurar después
          </button>
        )}
      </div>
    </div>
  )
}
