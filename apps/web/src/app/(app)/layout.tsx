import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppProviders } from '@/components/providers/AppProviders'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // Check onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', session.user.id)
    .single()

  if (!profile?.onboarding_done) redirect('/onboarding')

  return (
    <AppProviders>
      <div className="app-layout">
        <AppSidebar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </AppProviders>
  )
}
