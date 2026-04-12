import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

function encrypt(text: string): string {
  const { createCipheriv, randomBytes } = require('crypto')
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':')
}

// POST /api/integrations/connect — for API key providers (Intervals.icu)
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, api_key } = await request.json()

  if (!provider || !api_key) {
    return NextResponse.json({ error: 'provider and api_key required' }, { status: 400 })
  }

  // Validate the API key works before saving
  if (provider === 'intervals') {
    const testRes = await fetch('https://intervals.icu/api/v1/athlete/profile', {
      headers: { Authorization: `Basic ${Buffer.from(`API_KEY:${api_key}`).toString('base64')}` },
    })
    if (!testRes.ok) {
      return NextResponse.json({ error: 'API key inválida. Verifica que la clave sea correcta.' }, { status: 400 })
    }
    const profile = await testRes.json()

    const { error } = await supabase.from('connected_integrations').upsert({
      user_id: user.id,
      provider,
      provider_user_id: String(profile.athlete?.id ?? ''),
      provider_display_name: profile.athlete?.name,
      api_key_enc: encrypt(api_key),
      is_active: true,
      last_sync_status: 'pending',
    }, { onConflict: 'user_id,provider' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, display_name: profile.athlete?.name })
  }

  return NextResponse.json({ error: `Provider ${provider} does not use API keys` }, { status: 400 })
}
