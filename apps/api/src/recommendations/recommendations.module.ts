import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DailyRecommendationEntity } from './daily-recommendation.entity'
import { RecommendationEngine } from './recommendation-engine'
import { RecommendationsController } from './recommendations.controller'
import { MetricsModule } from '../metrics/metrics.module'
import { UsersModule } from '../users/users.module'
import { ActivitiesModule } from '../activities/activities.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyRecommendationEntity]),
    MetricsModule,
    UsersModule,
    ActivitiesModule,
    AuthModule,
  ],
  providers: [RecommendationEngine],
  controllers: [RecommendationsController],
  exports: [RecommendationEngine, TypeOrmModule],
})
export class RecommendationsModule {}
