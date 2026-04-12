'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
})

function AuthInit({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initialize().then(() => setReady(true))
  }, [])

  if (!ready) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--accent)' }}>⚡</div>
        <div style={{ fontSize: 13, color: 'var(--txt-3)' }}>Cargando...</div>
      </div>
    </div>
  )

  return <>{children}</>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>{children}</AuthInit>
    </QueryClientProvider>
  )
}
