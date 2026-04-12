import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ?? 'athleteos-strava-verify'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// GET — Strava subscription verification challenge
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// POST — Strava activity events
export async function POST(request: Request) {
  // Acknowledge immediately (Strava requires <2 seconds)
  const body = await request.json()

  if (body.object_type === 'activity' && body.aspect_type === 'create') {
    const supabase = createServerSupabaseClient()

    // Find user by Strava owner_id
    const { data: integration } = await supabase
      .from('connected_integrations')
      .select('user_id')
      .eq('provider', 'strava')
      .eq('provider_user_id', String(body.owner_id))
      .eq('is_active', true)
      .single()

    if (integration) {
      // Trigger sync in background (fire and forget)
      fetch(`${APP_URL}/api/integrations/strava/sync`, {
        method: 'POST',
        headers: { 'x-internal-sync': 'true' },
      }).catch(() => {})

      // Recalculate metrics and recommendation
      setTimeout(async () => {
        await fetch(`${APP_URL}/api/metrics/calculate`, { method: 'POST' })
        await fetch(`${APP_URL}/api/recommendations/generate`, { method: 'POST' })
      }, 10000) // wait 10s for sync to complete
    }
  }

  return NextResponse.json({ received: true })
}
