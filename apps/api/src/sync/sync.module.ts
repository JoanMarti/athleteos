import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SyncService } from './sync.service'
import { SyncProcessor } from './sync.processor'
import { SyncController } from './sync.controller'
import { StravaAdapter } from './strava.adapter'
import { WhoopAdapter } from './whoop.adapter'
import { ConnectedAccountEntity } from '../connected-accounts/connected-account.entity'
import { EncryptionService } from '../common/encryption.service'
import { ActivitiesModule } from '../activities/activities.module'
import { RecoveryModule } from '../recovery/recovery.module'
import { MetricsModule } from '../metrics/metrics.module'
import { UsersModule } from '../users/users.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }),
    TypeOrmModule.forFeature([ConnectedAccountEntity]),
    ActivitiesModule,
    RecoveryModule,
    MetricsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [SyncService, SyncProcessor, StravaAdapter, WhoopAdapter, EncryptionService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}
