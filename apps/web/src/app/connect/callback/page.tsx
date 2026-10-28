'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseOAuthCallback, saveToken, SOURCE_CONFIGS } from '@/lib/dataSources'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [sourceName, setSourceName] = useState('')

  useEffect(() => {
    const result = parseOAuthCallback()
    if (result) {
      saveToken(result.source, result.token, { expiresIn: result.expiresIn })
      setSourceName(SOURCE_CONFIGS[result.source].name)
      setStatus('success')
      setTimeout(() => router.push('/connect/'), 2000)
    } else {
      setStatus('error')
      setTimeout(() => router.push('/connect/'), 3000)
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: 40 }}>⟳</div>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Conectando fuente de datos…
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize: 48 }}>✅</div>
          <p style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
            {sourceName} conectado
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirigiendo…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 48 }}>❌</div>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            No se pudo completar la conexión
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirigiendo…</p>
        </>
      )}
    </div>
  )
}
