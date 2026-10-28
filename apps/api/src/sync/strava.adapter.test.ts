import { StravaAdapter } from '../sync/strava.adapter'
import { MOCK_STRAVA_ACTIVITIES } from '@athleteos/mocks'
import type { AthleteProfileEntity } from '../users/athlete-profile.entity'

describe('StravaAdapter', () => {
  let adapter: StravaAdapter

  beforeEach(() => {
    adapter = new StravaAdapter()
  })

  const mockProfile: Partial<AthleteProfileEntity> = {
    ftp_watts: 250,
    max_hr: 185,
    gender: 'male',
  }

  describe('normalize — cycling session with power', () => {
    const rawRide = MOCK_STRAVA_ACTIVITIES.find(a => a.type === 'Ride' && a.weighted_average_watts)!

    it('maps to cycling sport_type', () => {
      const result = adapter.normalize(rawRide, 'user-1', mockProfile)
      expect(result.sport_type).toBe('cycling')
    })

    it('calculates TSS when power data is available', () => {
      const result = adapter.normalize(rawRide, 'user-1', mockProfile)
      expect(result.training_load).toBeDefined()
      expect(result.training_load!).toBeGreaterThan(0)
    })

    it('sets normalized power from weighted_average_watts', () => {
      const result = adapter.normalize(rawRide, 'user-1', mockProfile)
      expect(result.normalized_power_watts).toBe(rawRide.weighted_average_watts)
    })

    it('converts kilojoules to calories', () => {
      const result = adapter.normalize(rawRide, 'user-1', mockProfile)
      if (rawRide.kilojoules) {
        expect(result.calories_estimated).toBe(Math.round(rawRide.kilojoules * 0.239))
      }
    })

    it('preserves external_id for deduplication', () => {
      const result = adapter.normalize(rawRide, 'user-1', mockProfile)
      expect(result.external_id).toBe(String(rawRide.id))
    })
  })

  describe('normalize — running session (no power)', () => {
    const rawRun = MOCK_STRAVA_ACTIVITIES.find(a => a.type === 'Run')!

    it('maps to running sport_type', () => {
      const result = adapter.normalize(rawRun, 'user-1', mockProfile)
      expect(result.sport_type).toBe('running')
    })

    it('uses HR-TRIMP for training load when no power data', () => {
      const result = adapter.normalize(rawRun, 'user-1', mockProfile)
      expect(result.training_load).toBeDefined()
      expect(result.normalized_power_watts).toBeUndefined()
    })

    it('calculates pace from average_speed', () => {
      const result = adapter.normalize(rawRun, 'user-1', mockProfile)
      if (rawRun.average_speed) {
        expect(result.average_pace_sec_km).toBeDefined()
        expect(result.average_pace_sec_km!).toBeGreaterThan(0)
      }
    })
  })

  describe('normalize — session without HR or power', () => {
    const minimalActivity = {
      ...MOCK_STRAVA_ACTIVITIES[0],
      average_heartrate: undefined,
      max_heartrate: undefined,
      average_watts: undefined,
      max_watts: undefined,
      weighted_average_watts: undefined,
      suffer_score: 80,
    }

    it('falls back to suffer score normalization', () => {
      const result = adapter.normalize(minimalActivity, 'user-1', {})
      expect(result.training_load).toBeDefined()
      expect(result.training_load!).toBeGreaterThan(0)
    })
  })

  describe('sport type mapping', () => {
    it.each([
      ['Ride', 'cycling'],
      ['VirtualRide', 'cycling'],
      ['GravelRide', 'cycling'],
      ['Run', 'running'],
      ['TrailRun', 'running'],
      ['Swim', 'swimming'],
      ['WeightTraining', 'strength'],
    ])('maps Strava type %s to our type %s', (stravaType, expected) => {
      const activity = { ...MOCK_STRAVA_ACTIVITIES[0], type: stravaType, sport_type: stravaType }
      const result = adapter.normalize(activity, 'user-1', {})
      expect(result.sport_type).toBe(expected)
    })
  })
})
