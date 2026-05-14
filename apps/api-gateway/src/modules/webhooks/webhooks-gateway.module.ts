import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { ClerkWebhookController } from './clerk-webhook.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [ClerkWebhookController],
})
export class WebhooksGatewayModule {}

