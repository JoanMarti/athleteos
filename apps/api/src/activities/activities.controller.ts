import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ActivitiesService } from './activities.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'activities', version: '1' })
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated list of training sessions' })
  async list(
    @Req() req: { userId: string },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findPaginated(req.userId, Number(page), Number(limit))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single training session by ID' })
  async findOne(@Req() req: { userId: string }, @Param('id') id: string) {
    return this.service.findById(req.userId, id)
  }
}
