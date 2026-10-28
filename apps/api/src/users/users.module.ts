import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './user.entity'
import { AthleteProfileEntity } from './athlete-profile.entity'
import { GoalEntity } from './goal.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { EncryptionService } from '../common/encryption.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AthleteProfileEntity, GoalEntity])],
  providers: [UsersService, EncryptionService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
