import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function decodeState(state: string): { userId: string } | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function encrypt(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const { createCipheriv, randomBytes } = require('crypto')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':')
}

const TOKEN_ENDPOINTS: Record<string, string> = {
  strava:        'https://www.strava.com/oauth/token',
  suunto:        'https://cloudapi-oauth.suunto.com/oauth/token',
  wahoo:         'https://api.wahooligan.com/oauth/token',
  whoop:         'https://api.prod.whoop.com/oauth/oauth2/token',
  trainingpeaks: 'https://oauth.trainingpeaks.com/oauth/token',
}

const CLIENT_IDS: Record<string, string | undefined> = {
  strava:        process.env.STRAVA_CLIENT_ID,
  suunto:        process.env.SUUNTO_CLIENT_ID,
  wahoo:         process.env.WAHOO_CLIENT_ID,
  whoop:         process.env.WHOOP_CLIENT_ID,
  trainingpeaks: process.env.TRAININGPEAKS_CLIENT_ID,
}

const CLIENT_SECRETS: Record<string, string | undefined> = {
  strava:        process.env.STRAVA_CLIENT_SECRET,
  suunto:        process.env.SUUNTO_CLIENT_SECRET,
  wahoo:         process.env.WAHOO_CLIENT_SECRET,
  whoop:         process.env.WHOOP_CLIENT_SECRET,
  trainingpeaks: process.env.TRAININGPEAKS_CLIENT_SECRET,
}

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${APP_URL}/app/profile?tab=integrations&error=${provider}_denied`)
  }

  const stateData = decodeState(state)
  if (!stateData?.userId) {
    return NextResponse.redirect(`${APP_URL}/app/profile?tab=integrations&error=invalid_state`)
  }

  try {
    const supabase = createServerSupabaseClient()

    // Exchange code for tokens
    const tokenEndpoint = TOKEN_ENDPOINTS[provider]
    const clientId = CLIENT_IDS[provider]
    const clientSecret = CLIENT_SECRETS[provider]

    if (!tokenEndpoint || !clientId || !clientSecret) {
      throw new Error(`Provider ${provider} not configured`)
    }

    const redirectUri = `${APP_URL}/api/integrations/${provider}/callback`
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`)

    const tokens = await tokenRes.json()

    const expiresAt = tokens.expires_at
      ? new Date(tokens.expires_at * 1000).toISOString()
      : tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null

    // Get provider user ID
    let providerUserId = tokens.athlete?.id?.toString() // Strava
      ?? tokens.user?.user_id?.toString()               // WHOOP
      ?? null

    // Upsert connected integration (tokens encrypted)
    await supabase.from('connected_integrations').upsert({
      user_id: stateData.userId,
      provider,
      provider_user_id: providerUserId,
      access_token_enc: encrypt(tokens.access_token),
      refresh_token_enc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt,
      is_active: true,
      last_sync_status: 'pending',
    }, { onConflict: 'user_id,provider' })

    // Trigger background backfill (fire and forget)
    fetch(`${APP_URL}/api/integrations/${provider}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: stateData.userId }),
    }).catch(() => {})

    return NextResponse.redirect(`${APP_URL}/app/profile?tab=integrations&connected=${provider}`)
  } catch (err: any) {
    console.error(`OAuth callback error for ${provider}:`, err)
    return NextResponse.redirect(`${APP_URL}/app/profile?tab=integrations&error=${provider}_failed`)
  }
}
