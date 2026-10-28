import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { InsightsService } from './insights.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'insights', version: '1' })
export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get unread insights and alerts' })
  async getUnread(@Req() req: { userId: string }) {
    return this.service.getUnread(req.userId)
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark insights as read' })
  async markRead(
    @Req() req: { userId: string },
    @Body() body: { ids: string[] },
  ) {
    await this.service.markRead(req.userId, body.ids)
    return { success: true }
  }

  @Patch('detect')
  @ApiOperation({ summary: 'Trigger insight detection (called after sync)' })
  async detect(@Req() req: { userId: string }) {
    await this.service.detectInsights(req.userId)
    return this.service.getUnread(req.userId)
  }
}
