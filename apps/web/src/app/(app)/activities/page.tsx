import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ActivityList } from '@/components/activities/ActivityList'

export const metadata: Metadata = { title: 'Actividades' }

export default async function ActivitiesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', margin: 0, letterSpacing: '-0.5px' }}>Actividades</h1>
        <p style={{ color: 'var(--txt-2)', margin: '3px 0 0', fontSize: 14 }}>
          {sessions?.length ?? 0} actividades sincronizadas
        </p>
      </div>
      <ActivityList sessions={(sessions ?? []) as any[]} />
    </div>
  )
}
