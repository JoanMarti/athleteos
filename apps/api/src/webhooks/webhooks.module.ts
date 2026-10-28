import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WebhooksController } from './webhooks.controller'
import { ConnectedAccountEntity } from '../connected-accounts/connected-account.entity'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }),
    TypeOrmModule.forFeature([ConnectedAccountEntity]),
  ],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
