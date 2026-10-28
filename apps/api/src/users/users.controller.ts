import {
  Controller, Get, Patch, Post, Delete,
  Body, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { AuthGuard } from '../auth/auth.guard'
import type { UpdateAthleteProfileDto, CreateGoalDto } from '@athleteos/types'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: { userId: string }) {
    return this.service.getProfile(req.userId)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update athlete profile (FTP, zones, weight, etc.)' })
  async updateMe(@Req() req: { userId: string }, @Body() dto: UpdateAthleteProfileDto) {
    return this.service.updateProfile(req.userId, dto)
  }

  @Get('me/goals')
  @ApiOperation({ summary: 'List all goals for the current user' })
  async getGoals(@Req() req: { userId: string }) {
    return this.service.getGoals(req.userId)
  }

  @Post('me/goals')
  @ApiOperation({ summary: 'Create a new training goal' })
  async createGoal(@Req() req: { userId: string }, @Body() dto: CreateGoalDto) {
    return this.service.createGoal(req.userId, dto)
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account and all data (GDPR)' })
  async deleteMe(@Req() req: { userId: string }) {
    await this.service.deleteUser(req.userId)
  }
}
