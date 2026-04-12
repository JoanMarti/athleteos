import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

interface Rule {
  id: string
  test: (ctx: RuleContext) => boolean
  output: (ctx: RuleContext) => RuleOutput
}

interface RuleContext {
  score: number
  label: string
  tsb: number
  ctl: number
  atl: number
  goalType?: string
  ftpWatts?: number
  primarySport: string
  consecutiveHardDays: number
  weeksToGoal?: number
  todayDow: number // 0=Sun, 6=Sat
}

interface RuleOutput {
  session_type: string
  sport: string
  title: string
  description: string
  duration_target_min: number
  intensity_zone: string
  tss_target: number
  reason: string
}

function buildOutput(ctx: RuleContext, o: RuleOutput): RuleOutput {
  return o
}

const RULES: Rule[] = [
  {
    id: 'R001_MANDATORY_REST',
    test: ctx => ctx.tsb < -35 || ctx.consecutiveHardDays >= 6,
    output: ctx => ({
      session_type: 'rest', sport: 'rest',
      title: 'Descanso completo',
      description: 'Tu cuerpo ha acumulado demasiada fatiga. El descanso completo hoy maximizará la adaptación de esta semana.',
      duration_target_min: 0, intensity_zone: 'z1', tss_target: 0,
      reason: `TSB en ${Math.round(ctx.tsb)} — fatiga crítica. Descansar es entrenar.`,
    }),
  },
  {
    id: 'R002_LOW_READINESS',
    test: ctx => ctx.label === 'poor' || ctx.label === 'rest_day' || ctx.score < 35,
    output: ctx => ({
      session_type: 'recovery',
      sport: ctx.primarySport === 'cycling' ? 'cycling' : 'running',
      title: `${ctx.primarySport === 'cycling' ? 'Rodaje suave Z1' : 'Trote muy suave Z1'}`,
      description: 'Recuperación activa únicamente. FC por debajo de Z2 todo el tiempo. Si te sientes mal, descansa directamente.',
      duration_target_min: 40, intensity_zone: 'z1', tss_target: 25,
      reason: `Readiness bajo (${ctx.score}/100). Solo recuperación activa hoy.`,
    }),
  },
  {
    id: 'R003_FRIDAY_AFTER_HARD_WEEK',
    test: ctx => ctx.todayDow === 5 && ctx.consecutiveHardDays >= 3,
    output: ctx => ({
      session_type: 'easy',
      sport: ctx.primarySport === 'cycling' ? 'cycling' : 'running',
      title: 'Sesión de descarga — fin de semana de trabajo duro',
      description: 'Has hecho 3+ días intensos esta semana. Hoy baja el ritmo deliberadamente para llegar bien al fin de semana.',
      duration_target_min: 45, intensity_zone: 'z2', tss_target: 35,
      reason: `Viernes tras ${ctx.consecutiveHardDays} días de carga alta.`,
    }),
  },
  {
    id: 'R004_TAPER',
    test: ctx => (ctx.weeksToGoal ?? 99) <= 2 && ctx.goalType === 'race_preparation',
    output: ctx => ({
      session_type: 'easy',
      sport: ctx.primarySport,
      title: ctx.weeksToGoal === 1 ? 'Activación precompetición' : 'Sesión de tapering',
      description: ctx.weeksToGoal === 1
        ? '20-30 min muy suaves con 3-4 aceleraciones cortas de 20 seg. Mantén las piernas vivas sin acumular fatiga.'
        : 'Reduce el volumen un 30% respecto a la semana anterior. Mantén algo de intensidad para no perder el punto.',
      duration_target_min: ctx.weeksToGoal === 1 ? 35 : 55,
      intensity_zone: ctx.weeksToGoal === 1 ? 'z2' : 'z3',
      tss_target: ctx.weeksToGoal === 1 ? 30 : 50,
      reason: `${ctx.weeksToGoal} semana${ctx.weeksToGoal === 1 ? '' : 's'} para tu carrera — protocolo de tapering activo.`,
    }),
  },
  {
    id: 'R005_MODERATE_ENDURANCE',
    test: ctx => ctx.score < 55 || ctx.tsb < -15,
    output: ctx => {
      const sport = ctx.primarySport
      const ftpNote = ctx.ftpWatts ? ` Apunta a ${Math.round(ctx.ftpWatts * 0.65)}–${Math.round(ctx.ftpWatts * 0.70)}W.` : ''
      return {
        session_type: 'easy',
        sport,
        title: sport === 'cycling' ? 'Rodaje aeróbico Z2' : 'Carrera aeróbica Z2',
        description: `Esfuerzo constante en Z2. Ritmo conversacional todo el tiempo.${ftpNote} Sin subidas de intensidad.`,
        duration_target_min: 70, intensity_zone: 'z2', tss_target: 55,
        reason: `Recuperación moderada (readiness ${ctx.score}/100, TSB ${Math.round(ctx.tsb)}). Consolida la base.`,
      }
    },
  },
  {
    id: 'R006_THRESHOLD',
    test: ctx => ctx.score >= 70 && ctx.goalType === 'ftp_improvement' && !!ctx.ftpWatts,
    output: ctx => {
      const ftp = ctx.ftpWatts!
      return {
        session_type: 'key_session',
        sport: 'cycling',
        title: 'Intervalos de umbral — 5×8min',
        description: `5 intervalos de 8 minutos a 95–105% FTP (${Math.round(ftp * 0.95)}–${Math.round(ftp * 1.05)}W). Recuperación completa de 3min entre cada uno. Mantén la potencia, no el ritmo cardíaco.`,
        duration_target_min: 75, intensity_zone: 'z4', tss_target: 95,
        reason: `Readiness ${ctx.score}/100 + objetivo FTP activo — ventana ideal para trabajo de umbral.`,
      }
    },
  },
  {
    id: 'R007_VO2MAX',
    test: ctx => ctx.score >= 70 && ctx.goalType === 'race_preparation' && ctx.tsb > -10,
    output: ctx => ({
      session_type: 'key_session',
      sport: ctx.primarySport === 'cycling' ? 'cycling' : 'running',
      title: ctx.primarySport === 'cycling' ? 'Esfuerzos VO2max — 6×3min' : 'Intervalos de carrera — 6×3min',
      description: ctx.primarySport === 'cycling'
        ? `6 esfuerzos de 3 min a 110–120% FTP. Recuperación 3min entre cada uno. No conviene ir más duro de Z5.`
        : '6 intervalos de 3 min a ritmo de 5K (máximo esfuerzo aeróbico sostenible). Trote suave entre esfuerzos.',
      duration_target_min: 60, intensity_zone: 'z5', tss_target: 85,
      reason: `Preparación de carrera + buena forma (readiness ${ctx.score}/100). Trabaja la potencia aeróbica máxima.`,
    }),
  },
  {
    id: 'R008_LONG_ENDURANCE',
    test: ctx => ctx.score >= 75 && (ctx.todayDow === 0 || ctx.todayDow === 6),
    output: ctx => ({
      session_type: 'easy',
      sport: ctx.primarySport,
      title: ctx.primarySport === 'cycling' ? 'Salida larga — fondo aeróbico' : 'Tirada larga — base aeróbica',
      description: ctx.primarySport === 'cycling'
        ? 'Salida larga en Z2. 80%+ del tiempo a ritmo conversacional. Opcional: incluye 2-3 subidas moderadas sin forzar.'
        : 'Carrera larga a ritmo cómodo y constante. No superes Z2 excepto en subidas. Prioriza la nutrición durante el esfuerzo.',
      duration_target_min: 150, intensity_zone: 'z2', tss_target: 120,
      reason: `Fin de semana + buena forma — sesión de fondo para construir base aeróbica.`,
    }),
  },
  {
    id: 'R009_DEFAULT',
    test: () => true,
    output: ctx => ({
      session_type: 'easy',
      sport: ctx.primarySport,
      title: ctx.primarySport === 'cycling' ? 'Rodaje aeróbico moderado' : 'Carrera moderada',
      description: 'Sesión aeróbica a ritmo cómodo. Mantén conversación posible. Si te sientes bien, puedes incluir algún cambio de ritmo breve.',
      duration_target_min: 60, intensity_zone: 'z2', tss_target: 55,
      reason: 'Recomendación base según forma y carga actuales.',
    }),
  },
]

export async function POST(_request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // Check if already exists and not pending
  const { data: existing } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing && existing.status !== 'pending') {
    return NextResponse.json(existing)
  }

  // Build context
  const [metricsRes, athleteRes, goalRes] = await Promise.all([
    supabase.from('daily_metrics').select('*').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('athlete_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_primary', true).eq('status', 'active').single(),
  ])

  const metrics = metricsRes.data as any
  const athlete = athleteRes.data as any
  const goal = goalRes.data as any

  if (!metrics) {
    return NextResponse.json({ error: 'No metrics for today. Run /api/metrics/calculate first.' }, { status: 400 })
  }

  let weeksToGoal: number | undefined
  if (goal?.target_date) {
    const ms = new Date(goal.target_date).getTime() - Date.now()
    weeksToGoal = Math.max(0, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)))
  }

  const ctx: RuleContext = {
    score: metrics.readiness_score ?? 50,
    label: metrics.readiness_label ?? 'moderate',
    tsb: metrics.tsb ?? 0,
    ctl: metrics.ctl ?? 0,
    atl: metrics.atl ?? 0,
    goalType: goal?.type,
    ftpWatts: athlete?.ftp_watts ?? undefined,
    primarySport: athlete?.primary_sport ?? 'cycling',
    consecutiveHardDays: metrics.consecutive_hard_days ?? 0,
    weeksToGoal,
    todayDow: new Date().getDay(),
  }

  // Find first matching rule
  const matchedRule = RULES.find(r => r.test(ctx))!
  const output = matchedRule.output(ctx)

  const rec = {
    user_id: user.id,
    date: today,
    ...output,
    status: 'pending',
    rule_id: matchedRule.id,
    confidence: metrics.readiness_confidence ?? 0.7,
  }

  const { data, error } = await supabase
    .from('daily_recommendations')
    .upsert(rec, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
