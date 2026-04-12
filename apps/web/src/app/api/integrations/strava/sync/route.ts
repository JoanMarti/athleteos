import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// ─── Encryption helper ────────────────────────────────────────────────────────
function decrypt(encText: string): string {
  const { createDecipheriv } = require('crypto')
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const [ivHex, tagHex, ctHex] = encText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ct = Buffer.from(ctHex, 'hex')
  const dec = createDecipheriv('aes-256-gcm', key, iv)
  dec.setAuthTag(tag)
  return Buffer.concat([dec.update(ct), dec.final()]).toString('utf8')
}

// ─── Strava activity normalizer ───────────────────────────────────────────────
function normalizeStravaActivity(raw: any, userId: string) {
  const SPORT_MAP: Record<string, string> = {
    Ride: 'cycling', VirtualRide: 'cycling', GravelRide: 'cycling', MountainBikeRide: 'cycling',
    Run: 'running', VirtualRun: 'running', TrailRun: 'running',
    Swim: 'swimming', WeightTraining: 'strength', Triathlon: 'triathlon',
  }
  return {
    user_id: userId,
    source_provider: 'strava',
    external_id: String(raw.id),
    external_url: `https://www.strava.com/activities/${raw.id}`,
    sport_type: SPORT_MAP[raw.sport_type] ?? SPORT_MAP[raw.type] ?? 'other',
    title: raw.name,
    started_at: raw.start_date,
    duration_seconds: raw.moving_time,
    distance_meters: raw.distance || null,
    elevation_gain_meters: raw.total_elevation_gain || null,
    average_power_watts: raw.average_watts || null,
    normalized_power_watts: raw.weighted_average_watts || null,
    average_hr_bpm: raw.average_heartrate ? Math.round(raw.average_heartrate) : null,
    max_hr_bpm: raw.max_heartrate ? Math.round(raw.max_heartrate) : null,
    average_pace_sec_km: raw.average_speed > 0 ? Math.round(1000 / raw.average_speed) : null,
    average_cadence_rpm: raw.average_cadence || null,
    calories_estimated: raw.kilojoules ? Math.round(raw.kilojoules * 0.239) : null,
    kilojoules: raw.kilojoules || null,
    is_race: false,
    is_manual: raw.manual,
    is_trainer: raw.trainer,
    training_load: raw.suffer_score ? Math.round(raw.suffer_score * 0.65) : null,
  }
}

// ─── POST /api/integrations/strava/sync ──────────────────────────────────────
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: integration } = await supabase
    .from('connected_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'strava')
    .eq('is_active', true)
    .single()

  if (!integration) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
  }

  // Mark as syncing
  await supabase.from('connected_integrations').update({ last_sync_status: 'syncing' }).eq('id', integration.id)

  try {
    const accessToken = decrypt(integration.access_token_enc)

    // Fetch last 30 days
    const since = Math.floor((Date.now() - 30 * 86400000) / 1000)
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${since}&per_page=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Strava API error: ${res.status} ${errText}`)
    }

    const activities: any[] = await res.json()
    let synced = 0

    for (const activity of activities) {
      const normalized = normalizeStravaActivity(activity, user.id)
      const { error } = await supabase
        .from('training_sessions')
        .upsert(normalized, { onConflict: 'user_id,source_provider,external_id' })
      if (!error) synced++
    }

    await supabase.from('connected_integrations').update({
      last_sync_status: 'success',
      last_sync_at: new Date().toISOString(),
      total_activities_synced: (integration.total_activities_synced ?? 0) + synced,
      last_sync_error: null,
    }).eq('id', integration.id)

    return NextResponse.json({ synced, total: activities.length })
  } catch (err: any) {
    await supabase.from('connected_integrations').update({
      last_sync_status: 'error',
      last_sync_error: err.message,
    }).eq('id', integration.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
