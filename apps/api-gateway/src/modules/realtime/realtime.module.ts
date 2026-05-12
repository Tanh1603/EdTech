import { Module } from '@nestjs/common';
import { RealtimeAuthGuard } from './guards/realtime-auth.guard';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimePublisher } from './realtime.publisher';

@Module({
  providers: [RealtimeAuthGuard, RealtimeGateway, RealtimePublisher],
  exports: [RealtimePublisher],
})
export class RealtimeModule {}

