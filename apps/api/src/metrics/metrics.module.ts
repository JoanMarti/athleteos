import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReadinessScoreEntity } from './readiness-score.entity'
import { MetricsService } from './metrics.service'
import { ActivitiesModule } from '../activities/activities.module'
import { RecoveryModule } from '../recovery/recovery.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadinessScoreEntity]),
    ActivitiesModule,
    RecoveryModule,
    AuthModule,
  ],
  providers: [MetricsService],
  exports: [MetricsService, TypeOrmModule],
})
export class MetricsModule {}
