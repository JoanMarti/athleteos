'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SourceId = 'strava' | 'fitbit' | 'suunto'

export interface SourceConfig {
  id: SourceId
  name: string
  color: string
  logo: string          // emoji fallback
  authUrl: (redirectUri: string) => string
  scopes: string
  tokenKey: string
  refreshKey: string
  expiryKey: string
}

export interface ConnectedSource {
  id: SourceId
  accessToken: string
  refreshToken?: string
  expiresAt?: number    // unix ms
  connectedAt: number   // unix ms
}

// ─── Source definitions ────────────────────────────────────────────────────────

const BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/athleteos`
    : 'https://joanmarti.github.io/athleteos'

export const SOURCE_CONFIGS: Record<SourceId, SourceConfig> = {
  strava: {
    id: 'strava',
    name: 'Strava',
    color: '#FC4C02',
    logo: '🏃',
    scopes: 'read,activity:read_all',
    tokenKey: 'athleteos_strava_token',
    refreshKey: 'athleteos_strava_refresh',
    expiryKey: 'athleteos_strava_expiry',
    authUrl: (redirectUri) => {
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID ?? ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'read,activity:read_all',
      })
      return `https://www.strava.com/oauth/authorize?${params}`
    },
  },
  fitbit: {
    id: 'fitbit',
    name: 'Fitbit',
    color: '#00B0B9',
    logo: '⌚',
    scopes: 'activity heartrate sleep profile',
    tokenKey: 'athleteos_fitbit_token',
    refreshKey: 'athleteos_fitbit_refresh',
    expiryKey: 'athleteos_fitbit_expiry',
    authUrl: (redirectUri) => {
      const clientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID ?? ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',   // Fitbit supports implicit grant for SPAs
        scope: 'activity heartrate sleep profile',
        expires_in: '604800',
      })
      return `https://www.fitbit.com/oauth2/authorize?${params}`
    },
  },
  suunto: {
    id: 'suunto',
    name: 'Suunto',
    color: '#E8000B',
    logo: '🔴',
    scopes: 'workout',
    tokenKey: 'athleteos_suunto_token',
    refreshKey: 'athleteos_suunto_refresh',
    expiryKey: 'athleteos_suunto_expiry',
    authUrl: (redirectUri) => {
      const clientId = process.env.NEXT_PUBLIC_SUUNTO_CLIENT_ID ?? ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'workout',
      })
      return `https://cloudapi-oauth.suunto.com/oauth/authorize?${params}`
    },
  },
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch { /* ignore */ }
}
function safeDel(key: string) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the connected source or null */
export function getConnectedSource(id: SourceId): ConnectedSource | null {
  const cfg = SOURCE_CONFIGS[id]
  const token = safeGet(cfg.tokenKey)
  if (!token) return null

  const expiry = Number(safeGet(cfg.expiryKey) ?? '0')
  // Consider expired if within 5 minutes
  if (expiry && Date.now() > expiry - 5 * 60 * 1000) {
    disconnectSource(id)
    return null
  }

  return {
    id,
    accessToken: token,
    refreshToken: safeGet(cfg.refreshKey) ?? undefined,
    expiresAt: expiry || undefined,
    connectedAt: Number(safeGet(`${cfg.tokenKey}_at`) ?? '0'),
  }
}

/** Returns all connected sources */
export function getAllConnectedSources(): ConnectedSource[] {
  return (['strava', 'fitbit', 'suunto'] as SourceId[])
    .map(getConnectedSource)
    .filter((s): s is ConnectedSource => s !== null)
}

/** Save a token after OAuth callback */
export function saveToken(
  id: SourceId,
  accessToken: string,
  opts?: { refreshToken?: string; expiresIn?: number }
) {
  const cfg = SOURCE_CONFIGS[id]
  safeSet(cfg.tokenKey, accessToken)
  safeSet(`${cfg.tokenKey}_at`, String(Date.now()))
  if (opts?.refreshToken) safeSet(cfg.refreshKey, opts.refreshToken)
  if (opts?.expiresIn) {
    safeSet(cfg.expiryKey, String(Date.now() + opts.expiresIn * 1000))
  }
}

/** Disconnect a source — clear all its keys */
export function disconnectSource(id: SourceId) {
  const cfg = SOURCE_CONFIGS[id]
  safeDel(cfg.tokenKey)
  safeDel(cfg.refreshKey)
  safeDel(cfg.expiryKey)
  safeDel(`${cfg.tokenKey}_at`)
}

/** Start OAuth flow — redirects the browser */
export function startOAuth(id: SourceId) {
  const redirectUri = `${BASE_URL}/connect/callback/`
  // Save which source we're connecting so the callback page knows
  safeSet('athleteos_oauth_pending', id)
  const url = SOURCE_CONFIGS[id].authUrl(redirectUri)
  window.location.href = url
}

/** Parse OAuth callback from URL hash (implicit) or search params (code flow) */
export function parseOAuthCallback(): { source: SourceId; token: string; expiresIn?: number } | null {
  if (typeof window === 'undefined') return null

  const pending = safeGet('athleteos_oauth_pending') as SourceId | null
  if (!pending) return null

  // Implicit grant: token in hash (#access_token=...&expires_in=...)
  const hash = new URLSearchParams(window.location.hash.replace('#', ''))
  const tokenFromHash = hash.get('access_token')
  if (tokenFromHash) {
    const expiresIn = Number(hash.get('expires_in') ?? '0') || undefined
    safeDel('athleteos_oauth_pending')
    return { source: pending, token: tokenFromHash, expiresIn }
  }

  // Auth code: code in search params — for Strava/Suunto we need server-side
  // exchange, but we return the code so the UI can show a helpful message
  const search = new URLSearchParams(window.location.search)
  const code = search.get('code')
  if (code) {
    // For now: save a demo token so the UI shows as "connected"
    // In production this would be exchanged server-side for a real token
    safeDel('athleteos_oauth_pending')
    return { source: pending, token: `demo_${code.slice(0, 8)}`, expiresIn: 21600 }
  }

  return null
}
