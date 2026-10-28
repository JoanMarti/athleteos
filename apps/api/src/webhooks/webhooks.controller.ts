import { Controller, Post, Get, Body, Query, Headers, Req, Res, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { Response } from 'express'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConnectedAccountEntity } from '../connected-accounts/connected-account.entity'

// ─── Strava webhook ───────────────────────────────────────────────────────────

@ApiTags('Webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(
    private readonly config: ConfigService,
    @InjectQueue('sync') private readonly syncQueue: Queue,
    @InjectRepository(ConnectedAccountEntity)
    private readonly accountRepo: Repository<ConnectedAccountEntity>,
  ) {}

  /**
   * Strava webhook verification (GET) — Strava calls this once when subscribing.
   * Must echo back hub.challenge with the correct verify_token.
   */
  @Get('strava')
  @ApiOperation({ summary: 'Strava webhook subscription verification' })
  async stravaVerify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.config.get('STRAVA_WEBHOOK_VERIFY_TOKEN')
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Strava webhook subscription verified')
      return res.json({ 'hub.challenge': challenge })
    }
    return res.status(403).json({ error: 'Verification failed' })
  }

  /**
   * Strava webhook events (POST) — receives activity create/update/delete.
   * Must return 200 within 2 seconds. Process async via queue.
   */
  @Post('strava')
  @ApiOperation({ summary: 'Strava webhook event receiver' })
  async stravaEvent(@Body() event: StravaWebhookEvent, @Res() res: Response) {
    // Acknowledge immediately (Strava requires <2s response)
    res.status(200).send()

    if (event.object_type === 'activity' && event.aspect_type === 'create') {
      // Find the user by Strava athlete ID
      const account = await this.accountRepo.findOneBy({
        provider: 'strava',
        provider_user_id: String(event.owner_id),
        is_active: true,
      })

      if (account) {
        this.logger.log(`Strava activity created: ${event.object_id} for user ${account.user_id}`)
        await this.syncQueue.add('backfill', {
          userId: account.user_id,
          provider: 'strava',
          accountId: account.id,
          daysBack: 2, // Only sync recent 2 days for webhook-triggered sync
        }, {
          priority: 1,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        })
      }
    }
  }

  /**
   * WHOOP webhook events (POST) — receives recovery/workout updates.
   */
  @Post('whoop')
  @ApiOperation({ summary: 'WHOOP webhook event receiver' })
  async whoopEvent(
    @Body() event: WhoopWebhookEvent,
    @Headers('x-whoop-signature') signature: string,
    @Res() res: Response,
  ) {
    res.status(200).send()

    // TODO: verify WHOOP signature (HMAC-SHA256) before processing
    const account = await this.accountRepo.findOneBy({
      provider: 'whoop',
      provider_user_id: String(event.user_id),
      is_active: true,
    })

    if (account && (event.type === 'recovery.updated' || event.type === 'sleep.updated')) {
      this.logger.log(`WHOOP event: ${event.type} for user ${account.user_id}`)
      await this.syncQueue.add('backfill', {
        userId: account.user_id,
        provider: 'whoop',
        accountId: account.id,
        daysBack: 2,
      }, { priority: 1, attempts: 3 })
    }
  }
}

interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete'
  object_id: number
  aspect_type: 'create' | 'update' | 'delete'
  owner_id: number
  subscription_id: number
  event_time: number
  updates?: Record<string, string>
}

interface WhoopWebhookEvent {
  user_id: number
  type: string
  trace_id: string
}
