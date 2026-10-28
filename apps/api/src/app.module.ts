import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'

import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ConnectedAccountsModule } from './connected-accounts/connected-accounts.module'
import { SyncModule } from './sync/sync.module'
import { ActivitiesModule } from './activities/activities.module'
import { RecoveryModule } from './recovery/recovery.module'
import { MetricsModule } from './metrics/metrics.module'
import { RecommendationsModule } from './recommendations/recommendations.module'
import { InsightsModule } from './insights/insights.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { DashboardModule } from './dashboard/dashboard.module'

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // ── Database ─────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') === 'development', // Use migrations in production
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // ── Redis / BullMQ ───────────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },  // 100 req/min general
    ]),

    // ── Feature modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    ConnectedAccountsModule,
    SyncModule,
    ActivitiesModule,
    RecoveryModule,
    MetricsModule,
    RecommendationsModule,
    InsightsModule,
    WebhooksModule,
    DashboardModule,
  ],
})
export class AppModule {}
