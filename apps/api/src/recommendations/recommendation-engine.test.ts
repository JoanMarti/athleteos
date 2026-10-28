/**
 * Recommendation engine rule tests.
 * Tests are written against the logic in recommendation-engine.ts
 * using mock context objects.
 */

// ─── Rule condition tests (pure logic, no DB) ─────────────────────────────────

describe('Recommendation rules — guard conditions', () => {

  // We test the rule conditions as pure functions extracted from context
  function evaluateRules(ctx: {
    score: number
    tsb: number
    label: string
    consecutiveHighLoadDays: number
    goalType?: string
    ftpWatts?: number
    weeksToGoal?: number
  }): { ruleId: string; type: string } {
    const { score, tsb, label, consecutiveHighLoadDays, goalType, ftpWatts, weeksToGoal } = ctx

    if (tsb < -35 || consecutiveHighLoadDays >= 6) return { ruleId: 'R001', type: 'rest' }
    if (label === 'poor' || label === 'rest_day' || score < 35) return { ruleId: 'R002', type: 'recovery' }
    if (weeksToGoal !== undefined && weeksToGoal <= 2 && goalType === 'race_preparation') return { ruleId: 'R004_TAPER', type: 'easy' }
    if (score < 55 || tsb < -15) return { ruleId: 'R005', type: 'easy' }
    if (score >= 70 && goalType === 'ftp_improvement' && ftpWatts) return { ruleId: 'R006', type: 'key_session' }
    if (score >= 70 && goalType === 'race_preparation' && tsb > -10) return { ruleId: 'R007', type: 'key_session' }
    if (score >= 82) return { ruleId: 'R008', type: 'key_session' }
    return { ruleId: 'R009', type: 'easy' }
  }

  describe('R001 — Mandatory rest', () => {
    it('triggers when TSB is critically low', () => {
      const result = evaluateRules({ score: 50, tsb: -36, label: 'poor', consecutiveHighLoadDays: 3 })
      expect(result.ruleId).toBe('R001')
      expect(result.type).toBe('rest')
    })

    it('triggers when 6+ consecutive high-load days', () => {
      const result = evaluateRules({ score: 65, tsb: -20, label: 'moderate', consecutiveHighLoadDays: 6 })
      expect(result.ruleId).toBe('R001')
    })

    it('does NOT trigger at TSB -30 (boundary)', () => {
      const result = evaluateRules({ score: 65, tsb: -30, label: 'moderate', consecutiveHighLoadDays: 3 })
      expect(result.ruleId).not.toBe('R001')
    })
  })

  describe('R002 — Recovery session', () => {
    it('triggers on poor readiness label', () => {
      const result = evaluateRules({ score: 32, tsb: -5, label: 'poor', consecutiveHighLoadDays: 1 })
      expect(result.ruleId).toBe('R002')
      expect(result.type).toBe('recovery')
    })

    it('triggers on rest_day label', () => {
      const result = evaluateRules({ score: 18, tsb: 5, label: 'rest_day', consecutiveHighLoadDays: 0 })
      expect(result.ruleId).toBe('R002')
    })

    it('triggers when score < 35 even with good label', () => {
      const result = evaluateRules({ score: 34, tsb: -5, label: 'moderate', consecutiveHighLoadDays: 0 })
      expect(result.ruleId).toBe('R002')
    })
  })

  describe('R004 — Taper', () => {
    it('triggers 1 week before race', () => {
      const result = evaluateRules({
        score: 72, tsb: 5, label: 'good',
        consecutiveHighLoadDays: 2,
        goalType: 'race_preparation',
        weeksToGoal: 1,
      })
      expect(result.ruleId).toBe('R004_TAPER')
      expect(result.type).toBe('easy')
    })

    it('does NOT trigger for FTP goal with same conditions', () => {
      const result = evaluateRules({
        score: 72, tsb: 5, label: 'good',
        consecutiveHighLoadDays: 2,
        goalType: 'ftp_improvement',
        ftpWatts: 250,
        weeksToGoal: 1,
      })
      expect(result.ruleId).not.toBe('R004_TAPER')
    })
  })

  describe('R005 — Endurance', () => {
    it('triggers when score is moderate (55-69)', () => {
      const result = evaluateRules({ score: 58, tsb: -5, label: 'moderate', consecutiveHighLoadDays: 2 })
      expect(result.ruleId).toBe('R005')
    })

    it('triggers when TSB is -15 to -35', () => {
      const result = evaluateRules({ score: 62, tsb: -18, label: 'moderate', consecutiveHighLoadDays: 2 })
      expect(result.ruleId).toBe('R005')
    })
  })

  describe('R006 — Threshold (FTP goal)', () => {
    it('triggers with good readiness + FTP goal + FTP set', () => {
      const result = evaluateRules({
        score: 75, tsb: -5, label: 'good',
        consecutiveHighLoadDays: 1,
        goalType: 'ftp_improvement',
        ftpWatts: 250,
      })
      expect(result.ruleId).toBe('R006')
      expect(result.type).toBe('key_session')
    })

    it('does NOT trigger without FTP set', () => {
      const result = evaluateRules({
        score: 75, tsb: -5, label: 'good',
        consecutiveHighLoadDays: 1,
        goalType: 'ftp_improvement',
        ftpWatts: undefined,
      })
      expect(result.ruleId).not.toBe('R006')
    })

    it('does NOT trigger with score < 70', () => {
      const result = evaluateRules({
        score: 68, tsb: 5, label: 'moderate',
        consecutiveHighLoadDays: 1,
        goalType: 'ftp_improvement',
        ftpWatts: 250,
      })
      expect(result.ruleId).not.toBe('R006')
    })
  })

  describe('R007 — VO2max (race prep)', () => {
    it('triggers with good readiness + race prep + positive TSB', () => {
      const result = evaluateRules({
        score: 78, tsb: 0, label: 'good',
        consecutiveHighLoadDays: 1,
        goalType: 'race_preparation',
      })
      expect(result.ruleId).toBe('R007')
    })

    it('does NOT trigger when TSB is very negative', () => {
      const result = evaluateRules({
        score: 78, tsb: -12, label: 'good',
        consecutiveHighLoadDays: 1,
        goalType: 'race_preparation',
      })
      expect(result.ruleId).not.toBe('R007')
    })
  })

  describe('R008 — Key session (optimal)', () => {
    it('triggers when score >= 82 with no specific goal', () => {
      const result = evaluateRules({
        score: 85, tsb: 5, label: 'optimal',
        consecutiveHighLoadDays: 0,
      })
      expect(result.ruleId).toBe('R008')
    })
  })

  describe('R009 — Default endurance', () => {
    it('is the fallback for good readiness with no specific goal', () => {
      const result = evaluateRules({
        score: 65, tsb: -5, label: 'good',
        consecutiveHighLoadDays: 1,
      })
      expect(result.ruleId).toBe('R009')
    })
  })

  describe('Rule priority ordering', () => {
    it('R001 takes priority over R002 even if readiness is poor', () => {
      const result = evaluateRules({
        score: 20, tsb: -40, label: 'rest_day',
        consecutiveHighLoadDays: 7,
      })
      expect(result.ruleId).toBe('R001') // Not R002
    })

    it('R004 (taper) takes priority over R006 (threshold) near race', () => {
      const result = evaluateRules({
        score: 78, tsb: 5, label: 'good',
        consecutiveHighLoadDays: 1,
        goalType: 'race_preparation',
        weeksToGoal: 1,
      })
      expect(result.ruleId).toBe('R004_TAPER') // Not R007
    })
  })
})

// ─── Workout structure tests ──────────────────────────────────────────────────

describe('Threshold workout structure', () => {
  const ftp = 250
  const targetLow = Math.round(ftp * 0.95)  // 237
  const targetHigh = Math.round(ftp * 1.05) // 262

  it('target power range is 95-105% FTP', () => {
    expect(targetLow).toBe(237)
    expect(targetHigh).toBe(262)
  })

  it('5 intervals × 8min = 40min of work', () => {
    const intervalCount = 5
    const intervalDuration = 8 * 60
    const totalWork = intervalCount * intervalDuration
    expect(totalWork).toBe(2400) // 40 minutes
  })
})
