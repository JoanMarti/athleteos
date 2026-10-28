import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ImprovementInsightEntity } from './improvement-insight.entity'
import { InsightsService } from './insights.service'
import { InsightsController } from './insights.controller'
import { ActivitiesModule } from '../activities/activities.module'
import { MetricsModule } from '../metrics/metrics.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ImprovementInsightEntity]),
    ActivitiesModule,
    MetricsModule,
    AuthModule,
  ],
  providers: [InsightsService],
  controllers: [InsightsController],
  exports: [InsightsService],
})
export class InsightsModule {}
