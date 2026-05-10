import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { JobsGatewayController } from './jobs.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [JobsGatewayController],
})
export class JobsGatewayModule {}

