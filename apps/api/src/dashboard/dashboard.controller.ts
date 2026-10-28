import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('today')
  @ApiOperation({ summary: 'Aggregated today dashboard — readiness, recommendation, last activity, insights' })
  async getToday(@Req() req: { userId: string }) {
    return this.service.getToday(req.userId)
  }

  @Get('week')
  @ApiOperation({ summary: 'Weekly dashboard — load breakdown, sessions, sport breakdown' })
  async getWeek(
    @Req() req: { userId: string },
    @Query('week_start') weekStart?: string,
  ) {
    return this.service.getWeek(req.userId, weekStart)
  }
}
