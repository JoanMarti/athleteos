import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, FindManyOptions } from 'typeorm'
import { TrainingSessionEntity } from './training-session.entity'
import type { TrainingSession, PaginatedResponse } from '@athleteos/types'

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name)

  constructor(
    @InjectRepository(TrainingSessionEntity)
    private readonly repo: Repository<TrainingSessionEntity>,
  ) {}

  /**
   * Upsert a session from an external provider.
   * Deduplication is by (user_id, source, external_id).
   */
  async upsertFromProvider(
    data: Omit<TrainingSession, 'id' | 'created_at'>,
  ): Promise<TrainingSessionEntity> {
    if (data.external_id) {
      const existing = await this.repo.findOneBy({
        user_id: data.user_id,
        source: data.source,
        external_id: data.external_id,
      })
      if (existing) {
        await this.repo.update(existing.id, data as any)
        return { ...existing, ...data } as TrainingSessionEntity
      }
    }

    const session = this.repo.create(data as any)
    return this.repo.save(session)
  }

  async findRecent(
    userId: string,
    daysBack = 42,
  ): Promise<TrainingSessionEntity[]> {
    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    return this.repo.find({
      where: {
        user_id: userId,
        started_at: Between(since, new Date()),
      },
      order: { started_at: 'DESC' },
    })
  }

  async findPaginated(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TrainingSessionEntity>> {
    const [data, total] = await this.repo.findAndCount({
      where: { user_id: userId },
      order: { started_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { data, total, page, limit, has_more: total > page * limit }
  }

  async findById(userId: string, id: string): Promise<TrainingSessionEntity | null> {
    return this.repo.findOneBy({ id, user_id: userId })
  }

  async getLastActivity(userId: string): Promise<TrainingSessionEntity | null> {
    const [session] = await this.repo.find({
      where: { user_id: userId },
      order: { started_at: 'DESC' },
      take: 1,
    })
    return session ?? null
  }

  async getWeeklyLoad(userId: string, weekStart: Date): Promise<number> {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const sessions = await this.repo.find({
      where: {
        user_id: userId,
        started_at: Between(weekStart, weekEnd),
      },
      select: ['training_load'],
    })

    return sessions.reduce((sum, s) => sum + (s.training_load ?? 0), 0)
  }
}
