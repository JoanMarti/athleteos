import { Controller, Get, Patch, Param, Body, Req, UseGuards, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DailyRecommendationEntity } from './daily-recommendation.entity'
import { RecommendationEngine } from './recommendation-engine'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'recommendations', version: '1' })
export class RecommendationsController {
  constructor(
    private readonly engine: RecommendationEngine,
    @InjectRepository(DailyRecommendationEntity)
    private readonly repo: Repository<DailyRecommendationEntity>,
  ) {}

  @Get('today')
  @ApiOperation({ summary: 'Get (or generate) today\'s recommendation' })
  async getToday(@Req() req: { userId: string }) {
    const today = new Date().toISOString().split('T')[0]
    // Try to return existing, or generate new
    const existing = await this.repo.findOneBy({ user_id: req.userId, date: today })
    if (existing) return existing

    return this.engine.generateDailyRecommendation(req.userId, today)
  }

  @Get()
  @ApiOperation({ summary: 'Get recommendations for a date range' })
  async list(
    @Req() req: { userId: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qb = this.repo.createQueryBuilder('r')
      .where('r.user_id = :userId', { userId: req.userId })
      .orderBy('r.date', 'DESC')

    if (from) qb.andWhere('r.date >= :from', { from })
    if (to) qb.andWhere('r.date <= :to', { to })

    return qb.limit(30).getMany()
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recommendation status (done/skipped/modified)' })
  async update(
    @Req() req: { userId: string },
    @Param('id') id: string,
    @Body() body: { status: 'done' | 'skipped' | 'modified'; actual_session_id?: string },
  ) {
    await this.repo.update(
      { id, user_id: req.userId },
      { status: body.status, actual_session_id: body.actual_session_id ?? null },
    )
    return this.repo.findOneBy({ id })
  }
}
