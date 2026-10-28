'use client'
import { useState, useEffect } from 'react'
import { useDataSources } from './useDataSources'

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  distance: number          // metres
  moving_time: number       // seconds
  elapsed_time: number
  total_elevation_gain: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  weighted_average_watts?: number
  suffer_score?: number
  start_date: string
  start_date_local: string
  map?: { summary_polyline: string }
}

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  profile: string           // avatar URL
  city?: string
  country?: string
  sex?: 'M' | 'F'
  ftp?: number
}

interface UseStravaReturn {
  athlete: StravaAthlete | null
  activities: StravaActivity[]
  loading: boolean
  error: string | null
  isReal: boolean           // true = real API, false = mock
}

// ── Mock data fallback ────────────────────────────────────────────────────────

const MOCK_ATHLETE: StravaAthlete = {
  id: 0,
  firstname: 'Alex',
  lastname: 'Demo',
  profile: '',
  city: 'Barcelona',
  country: 'ES',
  ftp: 248,
}

const MOCK_ACTIVITIES: StravaActivity[] = [
  {
    id: 1001,
    name: 'Threshold intervals — 5×8min',
    type: 'Ride',
    sport_type: 'Ride',
    distance: 48200,
    moving_time: 5400,
    elapsed_time: 5820,
    total_elevation_gain: 320,
    average_heartrate: 154,
    max_heartrate: 174,
    average_watts: 218,
    weighted_average_watts: 234,
    suffer_score: 95,
    start_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    start_date_local: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 1002,
    name: 'Easy recovery run',
    type: 'Run',
    sport_type: 'Run',
    distance: 9300,
    moving_time: 3180,
    elapsed_time: 3240,
    total_elevation_gain: 45,
    average_heartrate: 132,
    max_heartrate: 148,
    suffer_score: 38,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    start_date_local: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 1003,
    name: 'Long ride — endurance base',
    type: 'Ride',
    sport_type: 'Ride',
    distance: 112000,
    moving_time: 14400,
    elapsed_time: 15000,
    total_elevation_gain: 890,
    average_heartrate: 138,
    max_heartrate: 162,
    average_watts: 196,
    weighted_average_watts: 208,
    suffer_score: 156,
    start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    start_date_local: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
]

// ── Real API fetch ─────────────────────────────────────────────────────────────

async function fetchStravaAthlete(token: string): Promise<StravaAthlete> {
  const res = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Strava athlete: ${res.status}`)
  return res.json()
}

async function fetchStravaActivities(token: string, perPage = 30): Promise<StravaActivity[]> {
  const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Strava activities: ${res.status}`)
  return res.json()
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStravaData(): UseStravaReturn {
  const { getToken } = useDataSources()
  const [state, setState] = useState<UseStravaReturn>({
    athlete: null,
    activities: [],
    loading: true,
    error: null,
    isReal: false,
  })

  useEffect(() => {
    const token = getToken('strava')

    if (!token || token.startsWith('demo_')) {
      // No real token — return mock data immediately
      setState({
        athlete: MOCK_ATHLETE,
        activities: MOCK_ACTIVITIES,
        loading: false,
        error: null,
        isReal: false,
      })
      return
    }

    // Real token — fetch from Strava API
    setState(s => ({ ...s, loading: true, error: null }))

    Promise.all([
      fetchStravaAthlete(token),
      fetchStravaActivities(token),
    ])
      .then(([athlete, activities]) => {
        setState({ athlete, activities, loading: false, error: null, isReal: true })
      })
      .catch(err => {
        console.error('Strava fetch error:', err)
        // Fall back to mock on error
        setState({
          athlete: MOCK_ATHLETE,
          activities: MOCK_ACTIVITIES,
          loading: false,
          error: err.message,
          isReal: false,
        })
      })
  }, [getToken])

  return state
}
