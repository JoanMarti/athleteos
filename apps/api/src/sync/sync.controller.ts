import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SyncService } from './sync.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'sync', version: '1' })
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post(':provider')
  @ApiOperation({ summary: 'Trigger a manual sync for a provider (recent 7 days)' })
  async triggerSync(
    @Req() req: { userId: string },
    @Param('provider') provider: string,
  ) {
    return this.service.triggerSync(req.userId, provider)
  }

  @Get(':provider/status')
  @ApiOperation({ summary: 'Get sync status for a provider' })
  async getSyncStatus(
    @Req() req: { userId: string },
    @Param('provider') provider: string,
  ) {
    return this.service.getSyncStatus(req.userId, provider)
  }
}
