import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { ActivitiesModule } from '../activities/activities.module'
import { RecoveryModule } from '../recovery/recovery.module'
import { MetricsModule } from '../metrics/metrics.module'
import { RecommendationsModule } from '../recommendations/recommendations.module'
import { InsightsModule } from '../insights/insights.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    ActivitiesModule,
    RecoveryModule,
    MetricsModule,
    RecommendationsModule,
    InsightsModule,
    AuthModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
