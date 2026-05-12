import { Module } from '@nestjs/common';
import { GatewayAuthModule } from '../auth/gateway-auth.module';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { RealtimeAuthGuard } from './guards/realtime-auth.guard';
import { RealtimeAccessService } from './realtime-access.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimePublisher } from './realtime.publisher';

@Module({
  imports: [GatewayAuthModule, GrpcClientsModule],
  providers: [
    RealtimeAccessService,
    RealtimeAuthGuard,
    RealtimeGateway,
    RealtimePublisher,
  ],
  exports: [RealtimePublisher],
})
export class RealtimeModule {}
