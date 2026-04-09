import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RecoverySessionEntity } from './recovery-session.entity'
import { SleepMetricsEntity } from './sleep-metrics.entity'
import { RecoveryService } from './recovery.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([RecoverySessionEntity, SleepMetricsEntity]),
    AuthModule,
  ],
  providers: [RecoveryService],
  exports: [RecoveryService, TypeOrmModule],
})
export class RecoveryModule {}
