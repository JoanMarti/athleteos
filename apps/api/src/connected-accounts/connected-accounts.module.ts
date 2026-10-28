import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConnectedAccountEntity } from './connected-account.entity'
import { ConnectedAccountsService } from './connected-accounts.service'
import { ConnectedAccountsController } from './connected-accounts.controller'
import { EncryptionService } from '../common/encryption.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }),
    TypeOrmModule.forFeature([ConnectedAccountEntity]),
    AuthModule,
  ],
  providers: [ConnectedAccountsService, EncryptionService],
  controllers: [ConnectedAccountsController],
  exports: [ConnectedAccountsService, TypeOrmModule],
})
export class ConnectedAccountsModule {}
