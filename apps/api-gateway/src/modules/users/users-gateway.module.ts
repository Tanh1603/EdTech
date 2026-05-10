import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { UsersGatewayController } from './users.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [UsersGatewayController],
})
export class UsersGatewayModule {}
