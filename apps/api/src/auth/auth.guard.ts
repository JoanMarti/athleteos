import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException, Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'

/**
 * AuthGuard — validates Supabase JWT from Authorization header.
 * Sets req.userId for use in controllers.
 *
 * In production this validates the JWT signature against Supabase's
 * public key. In development with mocks, any well-formed Bearer token works.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header')
    }

    const token = authHeader.split(' ')[1]

    try {
      // In mock mode: decode JWT without verification (dev only)
      const isMockMode = this.config.get('NODE_ENV') !== 'production'
        && !this.config.get('SUPABASE_URL')?.includes('supabase.co')

      if (isMockMode) {
        // For development: decode JWT payload without signature verification
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
        )
        request.userId = payload.sub ?? 'dev-user-id'
        return true
      }

      // Production: validate with Supabase
      const supabase = createClient(
        this.config.getOrThrow('SUPABASE_URL'),
        this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
      )

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token')
      }

      request.userId = user.id
      request.userEmail = user.email
      return true
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err
      this.logger.error('Auth validation error', err)
      throw new UnauthorizedException('Token validation failed')
    }
  }
}
