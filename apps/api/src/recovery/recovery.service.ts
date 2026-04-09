import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RecoverySessionEntity } from './recovery-session.entity'
import { SleepMetricsEntity } from './sleep-metrics.entity'
import type { RecoverySession, SleepMetrics } from '@athleteos/types'

@Injectable()
export class RecoveryService {
  constructor(
    @InjectRepository(RecoverySessionEntity)
    private readonly recoveryRepo: Repository<RecoverySessionEntity>,
    @InjectRepository(SleepMetricsEntity)
    private readonly sleepRepo: Repository<SleepMetricsEntity>,
  ) {}

  async upsertRecovery(data: Omit<RecoverySession, 'id' | 'created_at' | 'sleep_metrics'>): Promise<RecoverySessionEntity> {
    const existing = await this.recoveryRepo.findOneBy({
      user_id: data.user_id,
      source: data.source,
      date: data.date,
    })
    if (existing) {
      await this.recoveryRepo.update(existing.id, data as any)
      return { ...existing, ...data } as RecoverySessionEntity
    }
    const session = this.recoveryRepo.create(data as any)
    return this.recoveryRepo.save(session)
  }

  async upsertSleep(data: Omit<SleepMetrics, 'id'>): Promise<SleepMetricsEntity> {
    const existing = await this.sleepRepo.findOneBy({ user_id: data.user_id, date: data.date })
    if (existing) {
      await this.sleepRepo.update(existing.id, data as any)
      return { ...existing, ...data } as SleepMetricsEntity
    }
    const sleep = this.sleepRepo.create(data as any)
    return this.sleepRepo.save(sleep)
  }

  async getLatestRecovery(userId: string): Promise<RecoverySessionEntity | null> {
    const [session] = await this.recoveryRepo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
      take: 1,
    })
    return session ?? null
  }

  async getRecoveryForDate(userId: string, date: string): Promise<RecoverySessionEntity | null> {
    return this.recoveryRepo.findOneBy({ user_id: userId, date })
  }

  async getRecentHRV(userId: string, days = 30): Promise<{ date: string; hrv_ms: number }[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    const results = await this.recoveryRepo
      .createQueryBuilder('r')
      .select(['r.date', 'r.hrv_ms'])
      .where('r.user_id = :userId', { userId })
      .andWhere('r.date >= :since', { since: sinceStr })
      .andWhere('r.hrv_ms IS NOT NULL')
      .orderBy('r.date', 'ASC')
      .getRawMany()
    return results.map((r: any) => ({ date: r.r_date, hrv_ms: parseFloat(r.r_hrv_ms) }))
  }

  async getHRVBaseline(userId: string): Promise<{ avg: number; stddev: number } | null> {
    const result = await this.recoveryRepo
      .createQueryBuilder('r')
      .select('AVG(r.hrv_ms)', 'avg')
      .addSelect('STDDEV(r.hrv_ms)', 'stddev')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.hrv_ms IS NOT NULL')
      .andWhere("r.date >= NOW() - INTERVAL '30 days'")
      .getRawOne()
    if (!result?.avg) return null
    return { avg: parseFloat(result.avg), stddev: parseFloat(result.stddev ?? '5') }
  }

  async getLastNRecoveryScores(userId: string, n = 3): Promise<number[]> {
    const results = await this.recoveryRepo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
      take: n,
      select: ['recovery_score'],
    })
    return results
      .filter((r: RecoverySessionEntity) => r.recovery_score !== null)
      .map((r: RecoverySessionEntity) => r.recovery_score!)
      .reverse()
  }
}
