import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance } from 'axios'
import type {
  WhoopRecovery, WhoopSleepStage, WhoopWorkout,
  RecoverySession, SleepMetrics,
} from '@athleteos/types'
import { normalizeWhoopRecovery, normalizeWhoopStrain } from '@athleteos/utils'

const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v1'

@Injectable()
export class WhoopAdapter {
  private readonly logger = new Logger(WhoopAdapter.name)

  createClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: WHOOP_API_BASE,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  /**
   * Fetch recoveries since a given date (ISO string).
   */
  async fetchRecoveries(
    accessToken: string,
    startDate: string,
    mockMode = false,
  ): Promise<WhoopRecovery[]> {
    if (mockMode) {
      const { MOCK_WHOOP_RECOVERIES } = await import('@athleteos/mocks')
      return MOCK_WHOOP_RECOVERIES
    }

    const client = this.createClient(accessToken)
    const { data } = await client.get<{ records: WhoopRecovery[] }>('/recovery', {
      params: { start: startDate, limit: 25 },
    })
    return data.records
  }

  /**
   * Fetch sleep data since a given date.
   */
  async fetchSleep(
    accessToken: string,
    startDate: string,
    mockMode = false,
  ): Promise<WhoopSleepStage[]> {
    if (mockMode) {
      const { MOCK_WHOOP_SLEEP } = await import('@athleteos/mocks')
      return MOCK_WHOOP_SLEEP
    }

    const client = this.createClient(accessToken)
    const { data } = await client.get<{ records: WhoopSleepStage[] }>('/activity/sleep', {
      params: { start: startDate, limit: 25 },
    })
    return data.records
  }

  /**
   * Normalize WHOOP recovery to our RecoverySession schema.
   */
  normalizeRecovery(raw: WhoopRecovery, userId: string): Omit<RecoverySession, 'id' | 'created_at' | 'sleep_metrics'> {
    return {
      user_id: userId,
      source: 'whoop',
      external_id: String(raw.cycle_id),
      date: raw.created_at.split('T')[0],
      recovery_score: raw.score ? normalizeWhoopRecovery(raw.score.recovery_score) : undefined,
      hrv_ms: raw.score?.hrv_rmssd_milli,
      resting_hr_bpm: raw.score ? Math.round(raw.score.resting_heart_rate) : undefined,
      respiratory_rate: raw.score?.spo2_percentage, // Store SPO2 here temporarily
    }
  }

  /**
   * Normalize WHOOP sleep to our SleepMetrics schema.
   */
  normalizeSleep(raw: WhoopSleepStage, userId: string): Omit<SleepMetrics, 'id'> {
    const score = raw.score
    const stages = score?.stage_summary

    const totalMs = stages?.total_in_bed_time_milli ?? 0
    const awakeMs = stages?.total_awake_time_milli ?? 0
    const lightMs = stages?.total_light_sleep_time_milli ?? 0
    const deepMs = stages?.total_slow_wave_sleep_time_milli ?? 0
    const remMs = stages?.total_rem_sleep_time_milli ?? 0

    return {
      user_id: userId,
      date: raw.start.split('T')[0],
      total_duration_minutes: Math.round(totalMs / 60000),
      light_sleep_minutes: Math.round(lightMs / 60000),
      deep_sleep_minutes: Math.round(deepMs / 60000),
      rem_sleep_minutes: Math.round(remMs / 60000),
      awake_minutes: Math.round(awakeMs / 60000),
      sleep_efficiency: score
        ? score.sleep_efficiency_percentage / 100
        : totalMs > 0
          ? (totalMs - awakeMs) / totalMs
          : 0,
      sleep_score: score?.sleep_performance_percentage,
      sleep_consistency: score?.sleep_consistency_percentage,
      source: 'whoop',
    }
  }
}
