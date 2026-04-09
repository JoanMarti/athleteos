import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { TodayDashboard, WeeklyDashboard, ConnectedAccount } from '@athleteos/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
})

// Inject auth token from Supabase session
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sb-access-token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Query keys ──────────────────────────────────────────────────────────────
export const keys = {
  today: ['dashboard', 'today'] as const,
  week: (weekStart: string) => ['dashboard', 'week', weekStart] as const,
  accounts: ['connected-accounts'] as const,
  activities: (page: number) => ['activities', page] as const,
  recovery: (days: number) => ['recovery', days] as const,
}

// ─── Today dashboard ──────────────────────────────────────────────────────────
export function useTodayDashboard() {
  return useQuery({
    queryKey: keys.today,
    queryFn: async () => {
      const { data } = await api.get<TodayDashboard>('/api/v1/dashboard/today')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

// ─── Weekly dashboard ─────────────────────────────────────────────────────────
export function useWeeklyDashboard(weekStart?: string) {
  const start = weekStart ?? getMonday()
  return useQuery({
    queryKey: keys.week(start),
    queryFn: async () => {
      const { data } = await api.get<WeeklyDashboard>('/api/v1/dashboard/week', {
        params: { week_start: start },
      })
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Connected accounts ───────────────────────────────────────────────────────
export function useConnectedAccounts() {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: async () => {
      const { data } = await api.get<ConnectedAccount[]>('/api/v1/connected-accounts')
      return data
    },
  })
}

export function useConnectProvider() {
  return useMutation({
    mutationFn: async (provider: 'strava' | 'whoop') => {
      const { data } = await api.get<{ url: string }>(`/api/v1/connected-accounts/${provider}/connect`)
      window.location.href = data.url
    },
  })
}

export function useDisconnectProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/api/v1/connected-accounts/${provider}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.accounts }),
  })
}

// ─── Mark recommendation done/skipped ────────────────────────────────────────
export function useUpdateRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'done' | 'skipped' }) => {
      await api.patch(`/api/v1/recommendations/${id}`, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.today }),
  })
}

// ─── Trigger manual sync ─────────────────────────────────────────────────────
export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (provider: string) => {
      await api.post(`/api/v1/sync/${provider}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.today })
      qc.invalidateQueries({ queryKey: keys.accounts })
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
