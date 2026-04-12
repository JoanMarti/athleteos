'use client'
import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile, AthleteProfile } from '@athleteos/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  athleteProfile: AthleteProfile | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>
  updateAthleteProfile: (data: Partial<AthleteProfile>) => Promise<{ error?: string }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  athleteProfile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const supabase = createClient()
    set({ isLoading: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user, session })
        await get().refreshProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ user: session?.user ?? null, session })
        if (session?.user) {
          await get().refreshProfile()
        } else {
          set({ profile: null, athleteProfile: null })
        }
      })
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signInWithEmail: async (email, password) => {
    const supabase = createClient()
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    } finally {
      set({ isLoading: false })
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    const supabase = createClient()
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) return { error: error.message }
      return {}
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithGoogle: async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  signInWithApple: async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null, athleteProfile: null })
  },

  refreshProfile: async () => {
    const supabase = createClient()
    const { user } = get()
    if (!user) return

    const [profileRes, athleteRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('athlete_profiles').select('*').eq('user_id', user.id).single(),
    ])

    set({
      profile: profileRes.data as UserProfile | null,
      athleteProfile: athleteRes.data as AthleteProfile | null,
    })
  },

  updateProfile: async (data) => {
    const supabase = createClient()
    const { user } = get()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    if (!error) await get().refreshProfile()
    return { error: error?.message }
  },

  updateAthleteProfile: async (data) => {
    const supabase = createClient()
    const { user } = get()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('athlete_profiles')
      .update(data)
      .eq('user_id', user.id)

    if (!error) await get().refreshProfile()
    return { error: error?.message }
  },
}))
