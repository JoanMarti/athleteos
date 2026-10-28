'use client'
import { useMemo } from 'react'
import {
  getMockHealthData, buildHealthTimeline,
} from '@/lib/healthEngine'
import { RecoveryRing }  from '@/components/health/RecoveryRing'
import { GaugeDial }     from '@/components/health/GaugeDial'
import { ScoreBar }      from '@/components/health/ScoreBar'
import { SleepChart }    from '@/components/health/SleepChart'
import { HRVChart }      from '@/components/health/HRVChart'
import { LoadChart }     from '@/components/health/LoadChart'
import { SourceBadges }  from '@/components/health/SourceBadge'

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      borderTop: accent ? `2px solid ${accent}` : '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MiniStat({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </div>
  )
}

// ─── Assimilation score from ATL/CTL ratio ────────────────────────────────────
function assimilationScore(atl: number, ctl: number): number {
  // ratio 1.0 = perfect balance = ~35/100 on dial
  // ratio >1.5 = overloaded = 90/100
  // ratio <0.7 = detrained = 10/100
  const ratio = ctl > 0 ? atl / ctl : 1
  if (ratio < 0.7)  return 10
  if (ratio < 0.85) return 22
  if (ratio < 1.0)  return 35
  if (ratio < 1.15) return 50
  if (ratio < 1.3)  return 65
  if (ratio < 1.5)  return 80
  return 92
}

export default function HealthPage() {
  const { sleep, strava, suunto } = useMemo(() => getMockHealthData(), [])
  const trend = useMemo(() => buildHealthTimeline(sleep, strava, suunto), [sleep, strava, suunto])

  const today     = trend.days[trend.days.length - 1]
  const yesterday = trend.days[trend.days.length - 2]
  const latestSleep = sleep[sleep.length - 1]

  // Derived values for gauges
  const daysToRace = 81                                      // mock — from user goal
  const readinessPct = today.recovery_score                  // 0-100 → "Preparación hoy"
  const sessionsThisWeek = strava.filter(a => {              // sessions in last 7 days
    const d = new Date(a.date); const now = new Date()
    return (now.getTime() - d.getTime()) / 86400000 < 7
  }).length
  const sessionsTarget = 5                                   // from user profile / goal
  const assimilation = assimilationScore(today.atl, today.ctl)

  const fmtSleep = (m?: number) => m ? `${Math.floor(m / 60)}h ${m % 60}m` : '—'
  const sleepDebtH = Math.round(trend.sleep_debt_min / 60 * 10) / 10

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
            color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px',
          }}>
            Health &amp; Recovery
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            {trend.streak_good_recovery > 1 && (
              <span style={{ marginLeft: 12, color: '#3dd68c' }}>
                🔥 {trend.streak_good_recovery}-day recovery streak
              </span>
            )}
          </p>
        </div>
        <SourceBadges />
      </div>

      {/* ── GAUGE ROW — exactly like the reference image ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px 20px',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          alignItems: 'end',
          justifyItems: 'center',
        }}>

          {/* 1. Días al reto */}
          <RecoveryRing
            score={daysToRace}
            max={120}
            label="Días al reto"
            size={130}
            strokeWidth={10}
            color="#4299e1"
          />

          {/* 2. Preparación hoy (recovery %) */}
          <RecoveryRing
            score={readinessPct}
            max={100}
            label="Preparación hoy"
            unit="%"
            size={130}
            strokeWidth={10}
          />

          {/* 3. Sesiones hechas / objetivo */}
          <RecoveryRing
            score={sessionsThisWeek}
            max={sessionsTarget}
            label="Sesiones hechas"
            format="fraction"
            denominator={sessionsTarget}
            size={130}
            strokeWidth={10}
          />

          {/* 4. Asimilación — gauge with needle */}
          <GaugeDial
            value={assimilation}
            label="Asimilación"
            size={130}
          />

        </div>

        {/* Sub-labels row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: 16, marginTop: 8, justifyItems: 'center',
        }}>
          <SubLabel color="#4299e1" text={`Objetivo: ${new Date(Date.now() + daysToRace * 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`} />
          <SubLabel color={readinessPct >= 70 ? '#3dd68c' : readinessPct >= 50 ? '#f5a623' : '#f56565'}
            text={today.recovery_label.charAt(0).toUpperCase() + today.recovery_label.slice(1)} />
          <SubLabel color="#f5a623" text={`${sessionsTarget - sessionsThisWeek} restantes esta semana`} />
          <SubLabel color={assimilation < 50 ? '#3dd68c' : assimilation < 75 ? '#f5a623' : '#f56565'}
            text={assimilation < 40 ? 'Bien asimilado' : assimilation < 65 ? 'Carga moderada' : 'Carga alta'} />
        </div>
      </div>

      {/* Recommendation banner */}
      <div style={{
        padding: '12px 18px', marginBottom: 16,
        background: today.recovery_score >= 70 ? 'rgba(0,212,168,0.06)' : today.recovery_score >= 50 ? 'rgba(245,166,35,0.06)' : 'rgba(245,101,101,0.06)',
        border: `1px solid ${today.recovery_score >= 70 ? 'rgba(0,212,168,0.2)' : today.recovery_score >= 50 ? 'rgba(245,166,35,0.2)' : 'rgba(245,101,101,0.2)'}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>
          {today.recovery_score >= 70 ? '✅' : today.recovery_score >= 50 ? '🟡' : '🔴'}
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Recomendación de hoy
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {today.training_recommendation}
          </div>
        </div>
      </div>

      {/* ── Component scores ── */}
      <Card title="Componentes de recuperación" accent="#4299e1">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <ScoreBar label="HRV" value={today.hrv_score}
            rawValue={latestSleep?.hrv_rmssd ? `${latestSleep.hrv_rmssd} ms RMSSD` : undefined}
            color="#00d4a8" icon="💚" description="Recuperación autonómica" />
          <ScoreBar label="Calidad del sueño" value={today.sleep_score}
            rawValue={fmtSleep(latestSleep?.duration_min)}
            color="#9f7aea" icon="🌙" description="Duración + profundo + REM" />
          <ScoreBar label="FC en reposo" value={today.resting_hr_score}
            rawValue={latestSleep?.resting_hr ? `${latestSleep.resting_hr} bpm` : undefined}
            color="#f5a623" icon="❤️" description="Menor = mejor recuperación" />
          <ScoreBar label="SpO₂" value={today.spo2_score}
            rawValue={latestSleep?.spo2_avg ? `${latestSleep.spo2_avg}%` : undefined}
            color="#4299e1" icon="🫁" description="Saturación de oxígeno" />
        </div>
        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: 'var(--bg-elevated)', borderRadius: 10,
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
        }}>
          <MiniStat label="Recuperación media (7d)" value={`${trend.weekly_avg_recovery}`} unit="/100"
            color={trend.weekly_avg_recovery >= 70 ? '#3dd68c' : '#f5a623'} />
          <MiniStat label="HRV medio (7d)" value={`${trend.weekly_avg_hrv}`} unit="ms" color="#00d4a8" />
          <MiniStat label="Deuda de sueño (7d)" value={`${sleepDebtH}h`}
            color={sleepDebtH < 2 ? '#3dd68c' : sleepDebtH < 5 ? '#f5a623' : '#f56565'} />
        </div>
      </Card>

      {/* ── HRV trend ── */}
      <div style={{ marginTop: 16 }}>
        <Card title="Tendencia HRV — últimas 14 noches (Fitbit)" accent="#00d4a8">
          <HRVChart data={sleep} baseline={55} trend={trend.hrv_trend} />
        </Card>
      </div>

      {/* ── Sleep ── */}
      <div style={{ marginTop: 16 }}>
        <Card title="Arquitectura del sueño — Fitbit (14 noches)" accent="#9f7aea">
          <SleepChart data={sleep} />
        </Card>
      </div>

      {/* ── Training load ── */}
      <div style={{ marginTop: 16 }}>
        <Card title="Carga de entrenamiento — Strava + Suunto (30 días)" accent="#4299e1">
          <LoadChart strava={strava} suunto={suunto}
            atl={today.atl} ctl={today.ctl} tsb={today.tsb}
            risk={trend.overtraining_risk} />
        </Card>
      </div>

      {/* ── Recent activities ── */}
      <div style={{ marginTop: 16 }}>
        <Card title="Actividades recientes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...strava, ...suunto]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 6)
              .map((a, i) => {
                const isStrava = 'distance_m' in a
                const durationMin = Math.round(('moving_time_s' in a ? a.moving_time_s : a.duration_s) / 60)
                const distKm = isStrava ? Math.round((a as any).distance_m / 100) / 10 : null
                const sport = 'type' in a ? a.type : a.sport
                const emoji = sport === 'Ride' ? '🚴' : sport === 'Run' ? '🏃' : sport === 'Swimming' ? '🏊' : '💪'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isStrava ? 'rgba(252,76,2,0.12)' : 'rgba(232,0,11,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>{emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {a.date} · {durationMin}min
                        {distKm ? ` · ${distKm}km` : ''}
                        {a.avg_hr ? ` · ${a.avg_hr}bpm` : ''}
                      </div>
                    </div>
                    {'tss' in a && a.tss && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#4299e1' }}>{a.tss}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TSS</div>
                      </div>
                    )}
                    <div style={{
                      fontSize: 10, padding: '3px 7px', borderRadius: 20,
                      background: isStrava ? 'rgba(252,76,2,0.12)' : 'rgba(232,0,11,0.12)',
                      color: isStrava ? '#FC4C02' : '#E8000B', fontWeight: 600, flexShrink: 0,
                    }}>
                      {isStrava ? 'Strava' : 'Suunto'}
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7, padding: '0 4px' }}>
        ⓘ Puntuaciones basadas en literatura científica (Plews et al. 2013, Fullagar et al. 2015).
        Son orientativas y no constituyen consejo médico. Los datos mostrados son de ejemplo —
        conecta Fitbit, Strava y Suunto en tu perfil para ver tus datos reales.
      </div>
    </div>
  )
}

function SubLabel({ color, text }: { color: string; text: string }) {
  return (
    <div style={{ fontSize: 11, color, textAlign: 'center', fontWeight: 500 }}>{text}</div>
  )
}
