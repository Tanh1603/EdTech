import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { NotificationsGatewayController } from './notifications.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [NotificationsGatewayController],
})
export class NotificationsGatewayModule {}

