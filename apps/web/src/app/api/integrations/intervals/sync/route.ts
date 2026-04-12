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

export async function POST(_request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: integration } = await supabase
    .from('connected_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'intervals')
    .eq('is_active', true)
    .single()

  if (!integration) return NextResponse.json({ error: 'Intervals.icu not connected' }, { status: 400 })

  await supabase.from('connected_integrations').update({ last_sync_status: 'syncing' }).eq('id', integration.id)

  try {
    const apiKey = decrypt(integration.api_key_enc ?? integration.access_token_enc)

    // Get athlete ID from profile
    const profileRes = await fetch('https://intervals.icu/api/v1/athlete/profile', {
      headers: { Authorization: `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}` },
    })
    if (!profileRes.ok) throw new Error(`Intervals profile error: ${profileRes.status}`)
    const profile = await profileRes.json()
    const athleteId = profile.athlete?.id

    if (!athleteId) throw new Error('Could not get athlete ID from Intervals.icu')

    // Fetch activities for last 30 days
    const oldest = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const newest = new Date().toISOString().split('T')[0]

    const activitiesRes = await fetch(
      `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`,
      { headers: { Authorization: `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}` } }
    )
    if (!activitiesRes.ok) throw new Error(`Intervals activities error: ${activitiesRes.status}`)
    const activities: any[] = await activitiesRes.json()

    const SPORT_MAP: Record<string, string> = {
      Ride: 'cycling', VirtualRide: 'cycling', Run: 'running', Swim: 'swimming',
      WeightTraining: 'strength', Triathlon: 'triathlon',
    }

    let synced = 0
    for (const act of activities) {
      await supabase.from('training_sessions').upsert({
        user_id: user.id,
        source_provider: 'intervals',
        external_id: String(act.id),
        external_url: `https://intervals.icu/activities/${act.id}`,
        sport_type: SPORT_MAP[act.type] ?? 'other',
        title: act.name,
        started_at: act.start_date_local,
        duration_seconds: act.elapsed_time,
        distance_meters: act.distance || null,
        elevation_gain_meters: act.total_elevation_gain || null,
        average_power_watts: act.average_watts || null,
        normalized_power_watts: act.weighted_average_watts || null,
        average_hr_bpm: act.average_heartrate ? Math.round(act.average_heartrate) : null,
        max_hr_bpm: act.max_heartrate || null,
        training_load: act.training_load || null,
        training_stress_score: act.icu_training_load || null,
        intensity_factor: act.icu_intensity || null,
        is_race: act.race ?? false,
        is_manual: false,
        is_trainer: act.trainer ?? false,
      }, { onConflict: 'user_id,source_provider,external_id' })
      synced++
    }

    await supabase.from('connected_integrations').update({
      last_sync_status: 'success',
      last_sync_at: new Date().toISOString(),
      total_activities_synced: (integration.total_activities_synced ?? 0) + synced,
      last_sync_error: null,
      provider_metadata: { athlete_id: athleteId },
    }).eq('id', integration.id)

    return NextResponse.json({ synced })
  } catch (err: any) {
    await supabase.from('connected_integrations').update({
      last_sync_status: 'error',
      last_sync_error: err.message,
    }).eq('id', integration.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
