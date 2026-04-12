import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

function decrypt(encText: string): string {
  const { createDecipheriv } = require('crypto')
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const [ivHex, tagHex, ctHex] = encText.split(':')
  const dec = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  dec.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([dec.update(Buffer.from(ctHex, 'hex')), dec.final()]).toString('utf8')
}

async function whoopGet(path: string, token: string) {
  const res = await fetch(`https://api.prod.whoop.com/developer/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`WHOOP API error: ${res.status} on ${path}`)
  return res.json()
}

export async function POST(_request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: integration } = await supabase
    .from('connected_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'whoop')
    .eq('is_active', true)
    .single()

  if (!integration) return NextResponse.json({ error: 'WHOOP not connected' }, { status: 400 })

  await supabase.from('connected_integrations').update({ last_sync_status: 'syncing' }).eq('id', integration.id)

  try {
    const token = decrypt(integration.access_token_enc)

    // Fetch last 30 days
    const start = new Date(Date.now() - 30 * 86400000).toISOString()

    const [recoveryData, sleepData] = await Promise.all([
      whoopGet(`/recovery?start=${start}&limit=30`, token),
      whoopGet(`/activity/sleep?start=${start}&limit=30`, token),
    ])

    // Upsert recovery records
    for (const r of recoveryData.records ?? []) {
      if (r.score_state !== 'SCORED' || !r.score) continue
      await supabase.from('recovery_data').upsert({
        user_id: user.id,
        source_provider: 'whoop',
        date: r.created_at.split('T')[0],
        recovery_score: r.score.recovery_score,
        hrv_rmssd_ms: r.score.hrv_rmssd_milli,
        resting_hr_bpm: Math.round(r.score.resting_heart_rate),
        respiratory_rate: r.score.respiratory_rate ?? null,
        blood_oxygen_pct: r.score.spo2_percentage ?? null,
        skin_temp_celsius: r.score.skin_temp_celsius ?? null,
        provider_score: r.score.recovery_score,
        provider_label: r.score.recovery_score >= 67 ? 'green' : r.score.recovery_score >= 34 ? 'yellow' : 'red',
      }, { onConflict: 'user_id,source_provider,date' })
    }

    // Upsert sleep records
    for (const s of sleepData.records ?? []) {
      if (s.score_state !== 'SCORED' || !s.score) continue
      const stages = s.score.stage_summary
      const totalMin = Math.round((stages.total_in_bed_time_milli ?? 0) / 60000)
      await supabase.from('sleep_data').upsert({
        user_id: user.id,
        source_provider: 'whoop',
        date: s.start.split('T')[0],
        sleep_start: s.start,
        sleep_end: s.end,
        total_sleep_minutes: totalMin - Math.round((stages.total_awake_time_milli ?? 0) / 60000),
        total_in_bed_minutes: totalMin,
        awake_minutes: Math.round((stages.total_awake_time_milli ?? 0) / 60000),
        light_sleep_minutes: Math.round((stages.total_light_sleep_time_milli ?? 0) / 60000),
        deep_sleep_minutes: Math.round((stages.total_slow_wave_sleep_time_milli ?? 0) / 60000),
        rem_sleep_minutes: Math.round((stages.total_rem_sleep_time_milli ?? 0) / 60000),
        sleep_score: s.score.sleep_performance_percentage,
        sleep_efficiency: (s.score.sleep_efficiency_percentage ?? 0) / 100,
        sleep_consistency: s.score.sleep_consistency_percentage ?? null,
        disturbance_count: stages.disturbance_count ?? null,
        respiratory_rate: s.score.respiratory_rate ?? null,
      }, { onConflict: 'user_id,source_provider,date' })
    }

    await supabase.from('connected_integrations').update({
      last_sync_status: 'success',
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
    }).eq('id', integration.id)

    return NextResponse.json({ recovery: recoveryData.records?.length ?? 0, sleep: sleepData.records?.length ?? 0 })
  } catch (err: any) {
    await supabase.from('connected_integrations').update({
      last_sync_status: 'error',
      last_sync_error: err.message,
    }).eq('id', integration.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
