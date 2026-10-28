'use client'
import { useState, useEffect } from 'react'
import { useDataSources } from './useDataSources'

export interface FitbitSleepSummary {
  date: string
  duration_ms: number
  efficiency: number          // 0-100
  stages: { deep: number; light: number; rem: number; wake: number }  // minutes
  hrv_rmssd?: number
}

export interface FitbitHeartSummary {
  date: string
  resting_hr: number
  zones: {
    fat_burn: { min: number; max: number; minutes: number }
    cardio:   { min: number; max: number; minutes: number }
    peak:     { min: number; max: number; minutes: number }
  }
}

interface UseFitbitReturn {
  sleep: FitbitSleepSummary[]
  heart: FitbitHeartSummary[]
  loading: boolean
  error: string | null
  isReal: boolean
}

// ── Mock ──────────────────────────────────────────────────────────────────────

function mockSleep(daysAgo: number): FitbitSleepSummary {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return {
    date: d.toISOString().split('T')[0],
    duration_ms: (7.2 + Math.random() * 1.5) * 3600000,
    efficiency: 82 + Math.floor(Math.random() * 12),
    stages: {
      deep:  55 + Math.floor(Math.random() * 20),
      rem:   90 + Math.floor(Math.random() * 30),
      light: 180 + Math.floor(Math.random() * 40),
      wake:  15 + Math.floor(Math.random() * 20),
    },
    hrv_rmssd: 52 + Math.floor(Math.random() * 28),
  }
}

const MOCK_SLEEP: FitbitSleepSummary[] = Array.from({ length: 14 }, (_, i) => mockSleep(i))

const MOCK_HEART: FitbitHeartSummary[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - i)
  return {
    date: d.toISOString().split('T')[0],
    resting_hr: 42 + Math.floor(Math.random() * 8),
    zones: {
      fat_burn: { min: 97,  max: 135, minutes: 25 + Math.floor(Math.random() * 30) },
      cardio:   { min: 135, max: 166, minutes: 15 + Math.floor(Math.random() * 40) },
      peak:     { min: 166, max: 220, minutes: Math.floor(Math.random() * 15) },
    },
  }
})

// ── Real fetch helpers ────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

async function fetchFitbitSleep(token: string): Promise<FitbitSleepSummary[]> {
  const res = await fetch(
    `https://api.fitbit.com/1.2/user/-/sleep/date/${daysAgo(14)}/${today()}.json`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Fitbit sleep: ${res.status}`)
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.sleep ?? []).map((s: any) => ({
    date: s.dateOfSleep,
    duration_ms: s.duration,
    efficiency: s.efficiency,
    stages: {
      deep:  s.levels?.summary?.deep?.minutes ?? 0,
      rem:   s.levels?.summary?.rem?.minutes ?? 0,
      light: s.levels?.summary?.light?.minutes ?? 0,
      wake:  s.levels?.summary?.wake?.minutes ?? 0,
    },
    hrv_rmssd: undefined, // Fitbit HRV needs a separate endpoint
  }))
}

async function fetchFitbitHeart(token: string): Promise<FitbitHeartSummary[]> {
  const res = await fetch(
    `https://api.fitbit.com/1/user/-/activities/heart/date/${daysAgo(7)}/${today()}.json`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Fitbit heart: ${res.status}`)
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data['activities-heart'] ?? []).map((d: any) => ({
    date: d.dateTime,
    resting_hr: d.value?.restingHeartRate ?? 0,
    zones: {
      fat_burn: d.value?.heartRateZones?.find((z: any) => z.name === 'Fat Burn') ?? { min: 97, max: 135, minutes: 0 },
      cardio:   d.value?.heartRateZones?.find((z: any) => z.name === 'Cardio')   ?? { min: 135, max: 166, minutes: 0 },
      peak:     d.value?.heartRateZones?.find((z: any) => z.name === 'Peak')     ?? { min: 166, max: 220, minutes: 0 },
    },
  }))
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFitbitData(): UseFitbitReturn {
  const { getToken } = useDataSources()
  const [state, setState] = useState<UseFitbitReturn>({
    sleep: [], heart: [], loading: true, error: null, isReal: false,
  })

  useEffect(() => {
    const token = getToken('fitbit')

    if (!token || token.startsWith('demo_')) {
      setState({ sleep: MOCK_SLEEP, heart: MOCK_HEART, loading: false, error: null, isReal: false })
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    Promise.all([fetchFitbitSleep(token), fetchFitbitHeart(token)])
      .then(([sleep, heart]) => {
        setState({ sleep, heart, loading: false, error: null, isReal: true })
      })
      .catch(err => {
        setState({ sleep: MOCK_SLEEP, heart: MOCK_HEART, loading: false, error: err.message, isReal: false })
      })
  }, [getToken])

  return state
}
