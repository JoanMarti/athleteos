import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance } from 'axios'
import type { StravaActivity, TrainingSession, SportType } from '@athleteos/types'
import {
  calculateTSS,
  calculateHRTSS,
  normalizeStravaSufferScore,
  metersPerSecondToPaceSecKm,
} from '@athleteos/utils'
import { AthleteProfileEntity } from '../users/athlete-profile.entity'

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'

// Strava sport_type → our SportType
const SPORT_TYPE_MAP: Record<string, SportType> = {
  Ride: 'cycling', VirtualRide: 'cycling', MountainBikeRide: 'cycling', GravelRide: 'cycling',
  Run: 'running', VirtualRun: 'running', TrailRun: 'running',
  Swim: 'swimming', OpenWaterSwim: 'swimming',
  WeightTraining: 'strength', Crossfit: 'strength',
  Triathlon: 'triathlon',
}

@Injectable()
export class StravaAdapter {
  private readonly logger = new Logger(StravaAdapter.name)

  createClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: STRAVA_API_BASE,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  /**
   * Fetch all activities since a given epoch timestamp.
   * Handles Strava pagination (max 200 per page, rate limited).
   */
  async fetchActivitiesSince(
    accessToken: string,
    afterTimestamp: number,
    mockMode = false,
  ): Promise<StravaActivity[]> {
    if (mockMode) {
      const { MOCK_STRAVA_ACTIVITIES } = await import('@athleteos/mocks')
      return MOCK_STRAVA_ACTIVITIES
    }

    const client = this.createClient(accessToken)
    const activities: StravaActivity[] = []
    let page = 1

    while (true) {
      const { data } = await client.get<StravaActivity[]>('/athlete/activities', {
        params: { after: afterTimestamp, per_page: 200, page },
      })

      if (data.length === 0) break
      activities.push(...data)
      if (data.length < 200) break
      page++

      // Respect rate limits: 100 req/15min
      await this.sleep(300)
    }

    return activities
  }

  /**
   * Normalize a raw Strava activity to our TrainingSession schema.
   */
  normalize(
    raw: StravaActivity,
    userId: string,
    profile?: Partial<AthleteProfileEntity>,
  ): Omit<TrainingSession, 'id' | 'created_at'> {
    const sportType = SPORT_TYPE_MAP[raw.sport_type] ?? SPORT_TYPE_MAP[raw.type] ?? 'other'
    const ftp = profile?.ftp_watts
    const maxHR = profile?.max_hr ?? 190
    const restingHR = 45 // Default resting HR — ideally from WHOOP data

    // Calculate training load
    let trainingLoad: number | undefined
    let intensityFactor: number | undefined

    if (raw.weighted_average_watts && ftp) {
      // Power-based TSS (most accurate for cycling)
      intensityFactor = raw.weighted_average_watts / ftp
      trainingLoad = calculateTSS(raw.moving_time, raw.weighted_average_watts, ftp)
    } else if (raw.average_heartrate) {
      // HR-based TRIMP (running, swimming)
      trainingLoad = calculateHRTSS(
        raw.moving_time,
        raw.average_heartrate,
        restingHR,
        maxHR,
        profile?.gender as 'male' | 'female' ?? 'male',
      )
    } else if (raw.suffer_score) {
      // Fallback: normalize Suffer Score
      trainingLoad = normalizeStravaSufferScore(raw.suffer_score)
    }

    return {
      user_id: userId,
      source: 'strava',
      external_id: String(raw.id),
      sport_type: sportType,
      title: raw.name,
      started_at: raw.start_date,
      duration_seconds: raw.moving_time,
      distance_meters: raw.distance || undefined,
      elevation_gain_meters: raw.total_elevation_gain || undefined,
      training_load: trainingLoad,
      intensity_factor: intensityFactor,
      normalized_power_watts: raw.weighted_average_watts || undefined,
      average_power_watts: raw.average_watts || undefined,
      average_hr_bpm: raw.average_heartrate ? Math.round(raw.average_heartrate) : undefined,
      max_hr_bpm: raw.max_heartrate ? Math.round(raw.max_heartrate) : undefined,
      average_pace_sec_km: raw.average_speed
        ? metersPerSecondToPaceSecKm(raw.average_speed)
        : undefined,
      average_cadence_rpm: raw.average_cadence ? Math.round(raw.average_cadence) : undefined,
      calories_estimated: raw.kilojoules ? Math.round(raw.kilojoules * 0.239) : undefined,
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
