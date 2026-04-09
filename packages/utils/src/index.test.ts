import {
  calculateTSS,
  calculateATL,
  calculateCTL,
  calculateTSB,
  calculateHRZones,
  calculatePowerZones,
  calculateReadinessScore,
  getReadinessLabel,
  normalizeWhoopStrain,
  formatDuration,
  formatPace,
} from '../src/index'

describe('calculateTSS', () => {
  it('returns 100 for 1 hour at exactly FTP', () => {
    const tss = calculateTSS(3600, 250, 250)
    expect(tss).toBeCloseTo(100, 0)
  })

  it('returns ~56 for 1 hour at 75% FTP (tempo)', () => {
    const tss = calculateTSS(3600, 187, 250)
    expect(tss).toBeCloseTo(56, 0)
  })

  it('returns 0 for invalid FTP', () => {
    expect(calculateTSS(3600, 200, 0)).toBe(0)
  })

  it('scales linearly with duration', () => {
    const tss1h = calculateTSS(3600, 250, 250)
    const tss2h = calculateTSS(7200, 250, 250)
    expect(tss2h).toBeCloseTo(tss1h * 2, 0)
  })
})

describe('calculateATL / calculateCTL / calculateTSB', () => {
  const makeSessions = (loads: number[]) =>
    loads.map((load, i) => ({
      started_at: new Date(Date.now() - (loads.length - i) * 86400000).toISOString(),
      training_load: load,
    }))

  it('ATL is 0 with no sessions', () => {
    expect(calculateATL([])).toBe(0)
  })

  it('ATL responds faster to load changes than CTL', () => {
    const sessions = makeSessions([100, 100, 100, 100, 100, 100, 100])
    const atl = calculateATL(sessions)
    const ctl = calculateCTL(sessions)
    expect(atl).toBeGreaterThan(ctl) // CTL builds slower
  })

  it('TSB is negative when ATL > CTL (fatigued)', () => {
    expect(calculateTSB(60, 80)).toBe(-20)
  })

  it('TSB is positive when CTL > ATL (fresh)', () => {
    expect(calculateTSB(70, 50)).toBe(20)
  })
})

describe('calculateHRZones', () => {
  it('generates 5 zones from LTHR', () => {
    const zones = calculateHRZones(160)
    expect(Object.keys(zones)).toHaveLength(5)
    expect(zones.z1[0]).toBe(0)
    expect(zones.z5[1]).toBe(999)
  })

  it('zones are contiguous (no gaps)', () => {
    const zones = calculateHRZones(170)
    expect(zones.z2[0]).toBe(zones.z1[1] + 1)
    expect(zones.z3[0]).toBe(zones.z2[1] + 1)
  })
})

describe('calculatePowerZones', () => {
  it('zone 4 spans 90-104% FTP for 250W FTP', () => {
    const zones = calculatePowerZones(250)
    expect(zones.z4[0]).toBe(225) // 90% of 250
    expect(zones.z4[1]).toBe(260) // 104% of 250
  })

  it('zone 6 has no upper bound', () => {
    const zones = calculatePowerZones(250)
    expect(zones.z6[1]).toBe(9999)
  })
})

describe('calculateReadinessScore', () => {
  it('returns score in 0-100 range', () => {
    const result = calculateReadinessScore({
      hrv_ms: 65,
      hrv_30d_avg: 60,
      hrv_30d_stddev: 8,
      sleep_score: 80,
      sleep_efficiency: 0.88,
      atl: 50,
      ctl: 60,
    })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('gives good label for high HRV + good sleep + positive TSB', () => {
    const result = calculateReadinessScore({
      hrv_ms: 80,
      hrv_30d_avg: 60,
      hrv_30d_stddev: 8,
      sleep_score: 85,
      sleep_efficiency: 0.92,
      atl: 45,
      ctl: 60,
    })
    expect(['good', 'optimal']).toContain(result.label)
  })

  it('gives poor/rest_day label for very low HRV + poor sleep + high fatigue', () => {
    const result = calculateReadinessScore({
      hrv_ms: 28,
      hrv_30d_avg: 60,
      hrv_30d_stddev: 8,
      sleep_score: 40,
      sleep_efficiency: 0.65,
      atl: 95,
      ctl: 55,
    })
    expect(['poor', 'rest_day']).toContain(result.label)
  })

  it('returns neutral score with no data (50% confidence)', () => {
    const result = calculateReadinessScore({ atl: 50, ctl: 50 })
    expect(result.confidence).toBeLessThan(0.4)
  })
})

describe('getReadinessLabel', () => {
  it.each([
    [90, 'optimal'],
    [75, 'good'],
    [55, 'moderate'],
    [30, 'poor'],
    [10, 'rest_day'],
  ])('score %i → label %s', (score, expected) => {
    expect(getReadinessLabel(score)).toBe(expected)
  })
})

describe('normalizeWhoopStrain', () => {
  it('maps strain 21 to ~150 TSS', () => {
    expect(normalizeWhoopStrain(21)).toBeCloseTo(150, 0)
  })

  it('maps strain 0 to 0', () => {
    expect(normalizeWhoopStrain(0)).toBe(0)
  })

  it('maps strain 10 to ~71 TSS (proportional)', () => {
    expect(normalizeWhoopStrain(10)).toBeCloseTo(71, 0)
  })
})

describe('formatDuration', () => {
  it('formats seconds to "1h 15m"', () => {
    expect(formatDuration(4500)).toBe('1h 15m')
  })

  it('formats under 1 hour as "45m"', () => {
    expect(formatDuration(2700)).toBe('45m')
  })
})

describe('formatPace', () => {
  it('formats 330 sec/km as "5:30/km"', () => {
    expect(formatPace(330)).toBe('5:30/km')
  })

  it('formats 240 sec/km as "4:00/km"', () => {
    expect(formatPace(240)).toBe('4:00/km')
  })
})
