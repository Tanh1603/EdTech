import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { NotificationStreamService } from './notification-stream.service';
import { NotificationsGatewayController } from './notifications.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [NotificationsGatewayController],
  providers: [NotificationStreamService],
})
export class NotificationsGatewayModule {}

