import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import * as crypto from 'crypto'

// ─── Shared config ────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function generateState(userId: string): string {
  const random = crypto.randomBytes(16).toString('hex')
  return Buffer.from(JSON.stringify({ userId, random, ts: Date.now() })).toString('base64url')
}

// ─── OAuth configs per provider ───────────────────────────────────────────────

const OAUTH_CONFIGS = {
  strava: {
    authUrl: 'https://www.strava.com/oauth/authorize',
    params: {
      client_id: process.env.STRAVA_CLIENT_ID!,
      redirect_uri: `${APP_URL}/api/integrations/strava/callback`,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all,profile:read_all',
    },
  },
  garmin: {
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    params: {
      oauth_callback: `${APP_URL}/api/integrations/garmin/callback`,
    },
  },
  suunto: {
    authUrl: 'https://cloudapi-oauth.suunto.com/oauth/authorize',
    params: {
      client_id: process.env.SUUNTO_CLIENT_ID!,
      redirect_uri: `${APP_URL}/api/integrations/suunto/callback`,
      response_type: 'code',
      scope: 'workout',
    },
  },
  wahoo: {
    authUrl: 'https://api.wahooligan.com/oauth/authorize',
    params: {
      client_id: process.env.WAHOO_CLIENT_ID!,
      redirect_uri: `${APP_URL}/api/integrations/wahoo/callback`,
      response_type: 'code',
      scope: 'workouts_read user_read',
    },
  },
  whoop: {
    authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    params: {
      client_id: process.env.WHOOP_CLIENT_ID!,
      redirect_uri: `${APP_URL}/api/integrations/whoop/callback`,
      response_type: 'code',
      scope: 'offline read:recovery read:sleep read:workout read:profile read:body_measurement',
    },
  },
  trainingpeaks: {
    authUrl: 'https://oauth.trainingpeaks.com/oauth/authorize',
    params: {
      client_id: process.env.TRAININGPEAKS_CLIENT_ID!,
      redirect_uri: `${APP_URL}/api/integrations/trainingpeaks/callback`,
      response_type: 'code',
      scope: 'workouts',
    },
  },
}

// ─── GET /api/integrations/[provider]/auth-url ────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider as keyof typeof OAUTH_CONFIGS
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
  }

  const state = generateState(user.id)
  const url = new URL(config.authUrl)

  Object.entries(config.params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })
  url.searchParams.set('state', state)

  return NextResponse.json({ url: url.toString() })
}
