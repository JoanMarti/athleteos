import {
  Controller, Get, Post, Delete, Param, Query,
  Req, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Response } from 'express'
import { ConnectedAccountsService } from './connected-accounts.service'
import { AuthGuard } from '../auth/auth.guard'

@ApiTags('Connected Accounts')
@ApiBearerAuth()
@Controller({ path: 'connected-accounts', version: '1' })
export class ConnectedAccountsController {
  constructor(private readonly service: ConnectedAccountsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all connected accounts for the authenticated user' })
  async listAccounts(@Req() req: { userId: string }) {
    return this.service.getActiveAccounts(req.userId)
  }

  // ── Strava OAuth ─────────────────────────────────────────────────────────

  @Get('strava/connect')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get Strava OAuth authorization URL' })
  getStravaAuthUrl(@Req() req: { userId: string }) {
    return { url: this.service.getStravaAuthUrl(req.userId) }
  }

  @Get('strava/callback')
  @ApiOperation({ summary: 'Strava OAuth callback — exchange code for tokens' })
  @ApiResponse({ status: 302, description: 'Redirects to app after successful auth' })
  async stravaCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?error=strava_denied`)
    }

    try {
      await this.service.handleStravaCallback(code, state)
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?connected=strava`)
    } catch (err) {
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?error=strava_failed`)
    }
  }

  // ── WHOOP OAuth ───────────────────────────────────────────────────────────

  @Get('whoop/connect')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get WHOOP OAuth authorization URL' })
  getWhoopAuthUrl(@Req() req: { userId: string }) {
    return { url: this.service.getWhoopAuthUrl(req.userId) }
  }

  @Get('whoop/callback')
  @ApiOperation({ summary: 'WHOOP OAuth callback — exchange code for tokens' })
  async whoopCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?error=whoop_denied`)
    }

    try {
      await this.service.handleWhoopCallback(code, state)
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?connected=whoop`)
    } catch (err) {
      return res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile/accounts?error=whoop_failed`)
    }
  }

  // ── Disconnect ───────────────────────────────────────────────────────────

  @Delete(':provider')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a provider account' })
  async disconnect(
    @Req() req: { userId: string },
    @Param('provider') provider: string,
  ) {
    await this.service.disconnectAccount(req.userId, provider)
  }
}
