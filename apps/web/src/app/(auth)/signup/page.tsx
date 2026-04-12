'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'

export default function SignupPage() {
  const router = useRouter()
  const { signUpWithEmail, signInWithGoogle, signInWithApple, isLoading } = useAuthStore()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }

    const result = await signUpWithEmail(form.email, form.password, form.fullName)
    if (result.error) { setError(result.error); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: 28 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 10 }}>Revisa tu email</h2>
          <p style={{ color: 'var(--txt-2)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Hemos enviado un enlace de confirmación a <strong style={{ color: 'var(--txt)' }}>{form.email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
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
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>Crea tu cuenta</h1>
          <p style={{ fontSize: 14, color: 'var(--txt-2)' }}>Gratis para siempre en el plan Starter</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          {/* Social */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
            <button onClick={() => signInWithGoogle()} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button onClick={() => signInWithApple()} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                <path d="M14.045 9.32c-.022-2.28 1.864-3.376 1.948-3.43-1.061-1.55-2.712-1.762-3.302-1.784-1.402-.143-2.744.826-3.455.826-.71 0-1.805-.806-2.97-.783-1.518.023-2.924.882-3.707 2.243-1.581 2.74-.405 6.794 1.135 9.017.754 1.087 1.652 2.305 2.83 2.261 1.139-.046 1.566-.734 2.942-.734 1.376 0 1.766.734 2.97.712 1.224-.023 1.997-1.107 2.742-2.198.87-1.256 1.225-2.478 1.247-2.54-.027-.012-2.387-.916-2.38-3.59z"/>
                <path d="M11.405 3.068c.624-.757 1.047-1.808.93-2.858-.9.037-1.988.6-2.634 1.357-.577.668-1.083 1.739-.946 2.764.999.078 2.022-.506 2.65-1.263z"/>
              </svg>
              Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>o con email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Nombre completo</label>
              <input className="input" type="text" placeholder="Alex García" value={form.fullName} onChange={update('fullName')} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={update('email')} required autoComplete="email" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={update('password')} required autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Confirmar contraseña</label>
              <input className="input" type="password" placeholder="Repite la contraseña" value={form.confirm} onChange={update('confirm')} required autoComplete="new-password" />
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', padding: '12px', fontSize: 15 }}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Al registrarte aceptas nuestros <Link href="/terms" style={{ color: 'var(--txt-2)', textDecoration: 'none' }}>Términos de uso</Link> y{' '}
              <Link href="/privacy" style={{ color: 'var(--txt-2)', textDecoration: 'none' }}>Política de privacidad</Link>.
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 14, color: 'var(--txt-2)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
