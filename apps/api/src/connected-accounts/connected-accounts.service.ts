import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import axios from 'axios'
import * as crypto from 'crypto'
import { ConnectedAccountEntity } from './connected-account.entity'
import { EncryptionService } from '../common/encryption.service'

interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number }
}

interface WhoopTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

@Injectable()
export class ConnectedAccountsService {
  private readonly logger = new Logger(ConnectedAccountsService.name)

  constructor(
    @InjectRepository(ConnectedAccountEntity)
    private readonly repo: Repository<ConnectedAccountEntity>,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
    @InjectQueue('sync') private readonly syncQueue: Queue,
  ) {}

  // ── OAuth URL Generation ──────────────────────────────────────────────────

  getStravaAuthUrl(userId: string): string {
    const state = this.generateState(userId)
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow('STRAVA_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow('STRAVA_REDIRECT_URI'),
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all,profile:read_all',
      state,
    })
    return `https://www.strava.com/oauth/authorize?${params}`
  }

  getWhoopAuthUrl(userId: string): string {
    const state = this.generateState(userId)
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow('WHOOP_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow('WHOOP_REDIRECT_URI'),
      response_type: 'code',
      scope: 'offline read:recovery read:sleep read:workout read:profile read:body_measurement',
      state,
    })
    return `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`
  }

  // ── OAuth Callbacks ───────────────────────────────────────────────────────

  async handleStravaCallback(code: string, state: string): Promise<{ userId: string; accountId: string }> {
    const userId = this.verifyState(state)

    const tokenResponse = await this.exchangeStravaCode(code)
    const providerUserId = String(tokenResponse.athlete.id)

    const account = await this.upsertAccount({
      userId,
      provider: 'strava',
      providerUserId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(tokenResponse.expires_at * 1000),
      scopes: ['read', 'activity:read_all', 'profile:read_all'],
    })

    // Queue backfill of last 90 days
    await this.syncQueue.add('backfill', {
      userId,
      provider: 'strava',
      accountId: account.id,
      daysBack: 90,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    this.logger.log(`Strava connected for user ${userId}`)
    return { userId, accountId: account.id }
  }

  async handleWhoopCallback(code: string, state: string): Promise<{ userId: string; accountId: string }> {
    const userId = this.verifyState(state)

    const tokenResponse = await this.exchangeWhoopCode(code)
    const whoopProfile = await this.fetchWhoopProfile(tokenResponse.access_token)

    const account = await this.upsertAccount({
      userId,
      provider: 'whoop',
      providerUserId: String(whoopProfile.user_id),
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      scopes: tokenResponse.token_type.split(' '),
    })

    // Queue backfill
    await this.syncQueue.add('backfill', {
      userId,
      provider: 'whoop',
      accountId: account.id,
      daysBack: 90,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    this.logger.log(`WHOOP connected for user ${userId}`)
    return { userId, accountId: account.id }
  }

  // ── Token Management ──────────────────────────────────────────────────────

  /**
   * Get a valid access token, refreshing if expired.
   * This is the ONLY method that exposes decrypted tokens — only for internal use.
   */
  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.repo.findOneByOrFail({ id: accountId })

    const isExpiringSoon = account.token_expires_at
      && account.token_expires_at.getTime() < Date.now() + 5 * 60 * 1000

    if (isExpiringSoon && account.refresh_token_encrypted) {
      return await this.refreshToken(account)
    }

    return this.encryption.decrypt(account.access_token_encrypted)
  }

  async getActiveAccounts(userId: string) {
    return this.repo.find({
      where: { user_id: userId, is_active: true },
      select: ['id', 'provider', 'is_active', 'last_sync_at', 'sync_status', 'created_at'],
    })
  }

  async disconnectAccount(userId: string, provider: string): Promise<void> {
    await this.repo.update(
      { user_id: userId, provider: provider as ConnectedAccountEntity['provider'] },
      { is_active: false },
    )
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
    const useMock = this.config.get('ENABLE_STRAVA_MOCK') === 'true'
    if (useMock) {
      const { MOCK_STRAVA_TOKEN_RESPONSE } = await import('@athleteos/mocks')
      return MOCK_STRAVA_TOKEN_RESPONSE as unknown as StravaTokenResponse
    }

    const { data } = await axios.post<StravaTokenResponse>(
      'https://www.strava.com/oauth/token',
      {
        client_id: this.config.getOrThrow('STRAVA_CLIENT_ID'),
        client_secret: this.config.getOrThrow('STRAVA_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
      },
    )
    return data
  }

  private async exchangeWhoopCode(code: string): Promise<WhoopTokenResponse> {
    const useMock = this.config.get('ENABLE_WHOOP_MOCK') === 'true'
    if (useMock) {
      const { MOCK_WHOOP_TOKEN_RESPONSE } = await import('@athleteos/mocks')
      return MOCK_WHOOP_TOKEN_RESPONSE as unknown as WhoopTokenResponse
    }

    const { data } = await axios.post<WhoopTokenResponse>(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      new URLSearchParams({
        client_id: this.config.getOrThrow('WHOOP_CLIENT_ID'),
        client_secret: this.config.getOrThrow('WHOOP_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.getOrThrow('WHOOP_REDIRECT_URI'),
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    return data
  }

  private async fetchWhoopProfile(accessToken: string): Promise<{ user_id: number }> {
    const useMock = this.config.get('ENABLE_WHOOP_MOCK') === 'true'
    if (useMock) return { user_id: 88888 }

    const { data } = await axios.get('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return data
  }

  private async refreshToken(account: ConnectedAccountEntity): Promise<string> {
    const refreshToken = this.encryption.decrypt(account.refresh_token_encrypted!)

    try {
      if (account.provider === 'strava') {
        const { data } = await axios.post<StravaTokenResponse>('https://www.strava.com/oauth/token', {
          client_id: this.config.getOrThrow('STRAVA_CLIENT_ID'),
          client_secret: this.config.getOrThrow('STRAVA_CLIENT_SECRET'),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        })
        await this.repo.update(account.id, {
          access_token_encrypted: this.encryption.encrypt(data.access_token),
          refresh_token_encrypted: this.encryption.encrypt(data.refresh_token),
          token_expires_at: new Date(data.expires_at * 1000),
        })
        return data.access_token
      }

      if (account.provider === 'whoop') {
        const { data } = await axios.post<WhoopTokenResponse>(
          'https://api.prod.whoop.com/oauth/oauth2/token',
          new URLSearchParams({
            client_id: this.config.getOrThrow('WHOOP_CLIENT_ID'),
            client_secret: this.config.getOrThrow('WHOOP_CLIENT_SECRET'),
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        )
        await this.repo.update(account.id, {
          access_token_encrypted: this.encryption.encrypt(data.access_token),
          refresh_token_encrypted: this.encryption.encrypt(data.refresh_token),
          token_expires_at: new Date(Date.now() + data.expires_in * 1000),
        })
        return data.access_token
      }

      throw new Error(`Unknown provider: ${account.provider}`)
    } catch (err) {
      this.logger.error(`Token refresh failed for account ${account.id}`, err)
      await this.repo.update(account.id, { is_active: false, sync_status: 'error', error_message: 'Token refresh failed' })
      throw err
    }
  }

  private async upsertAccount(params: {
    userId: string
    provider: ConnectedAccountEntity['provider']
    providerUserId: string
    accessToken: string
    refreshToken: string
    expiresAt: Date
    scopes: string[]
  }): Promise<ConnectedAccountEntity> {
    const existing = await this.repo.findOneBy({
      user_id: params.userId,
      provider: params.provider,
    })

    const data = {
      user_id: params.userId,
      provider: params.provider,
      provider_user_id: params.providerUserId,
      access_token_encrypted: this.encryption.encrypt(params.accessToken),
      refresh_token_encrypted: this.encryption.encrypt(params.refreshToken),
      token_expires_at: params.expiresAt,
      scopes: params.scopes,
      is_active: true,
      sync_status: 'pending' as const,
    }

    if (existing) {
      await this.repo.update(existing.id, data)
      return { ...existing, ...data }
    }

    const account = this.repo.create(data)
    return this.repo.save(account)
  }

  private generateState(userId: string): string {
    const random = crypto.randomBytes(16).toString('hex')
    // In production: store state in Redis with TTL=10min for CSRF validation
    return Buffer.from(JSON.stringify({ userId, random })).toString('base64url')
  }

  private verifyState(state: string): string {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
      if (!decoded.userId) throw new Error('Missing userId in state')
      return decoded.userId
    } catch {
      throw new BadRequestException('Invalid OAuth state parameter')
    }
  }
}
