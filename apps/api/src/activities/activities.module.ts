import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TrainingSessionEntity } from './training-session.entity'
import { ActivitiesService } from './activities.service'
import { ActivitiesController } from './activities.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([TrainingSessionEntity]), AuthModule],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [ActivitiesService, TypeOrmModule],
})
export class ActivitiesModule {}
