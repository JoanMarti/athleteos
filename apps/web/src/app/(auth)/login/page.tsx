'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/app'

  const { signInWithEmail, signInWithGoogle, signInWithApple, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await signInWithEmail(email, password)
    if (result.error) { setError(result.error); return }
    router.push(redirectTo)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--accent)' }}>⚡</div>
            <span style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 700, color: 'var(--txt)' }}>AthleteOS</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>Bienvenido de vuelta</h1>
          <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>Inicia sesión para continuar</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
            <button
              onClick={() => signInWithGoogle()}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <button
              onClick={() => signInWithApple()}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M14.045 9.32c-.022-2.28 1.864-3.376 1.948-3.43-1.061-1.55-2.712-1.762-3.302-1.784-1.402-.143-2.744.826-3.455.826-.71 0-1.805-.806-2.97-.783-1.518.023-2.924.882-3.707 2.243-1.581 2.74-.405 6.794 1.135 9.017.754 1.087 1.652 2.305 2.83 2.261 1.139-.046 1.566-.734 2.942-.734 1.376 0 1.766.734 2.97.712 1.224-.023 1.997-1.107 2.742-2.198.87-1.256 1.225-2.478 1.247-2.54-.027-.012-2.387-.916-2.38-3.59z"/>
                <path d="M11.405 3.068c.624-.757 1.047-1.808.93-2.858-.9.037-1.988.6-2.634 1.357-.577.668-1.083 1.739-.946 2.764.999.078 2.022-.506 2.65-1.263z"/>
              </svg>
              Continuar con Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>o con email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Contraseña</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                  ¿Olvidaste la contraseña?
                </Link>
              </div>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px', fontSize: 15 }}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 14, color: 'var(--txt-2)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
