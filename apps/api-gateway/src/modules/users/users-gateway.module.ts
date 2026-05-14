import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { RbacGatewayController, UsersGatewayController } from './users.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [UsersGatewayController, RbacGatewayController],
})
export class UsersGatewayModule {}
