import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { RealtimeModule } from '../realtime/realtime.module';
import {
  ChatAnalyticsGatewayController,
  ChatMessagesGatewayController,
  ChatSessionsGatewayController,
} from './chat.gateway.controller';

@Module({
  imports: [GrpcClientsModule, RealtimeModule],
  controllers: [
    ChatSessionsGatewayController,
    ChatMessagesGatewayController,
    ChatAnalyticsGatewayController,
  ],
})
export class ChatGatewayModule {}
