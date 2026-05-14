import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { AuthMeGatewayController } from './auth-me.gateway.controller';
import { GatewayIdentityService } from './gateway-identity.service';

@Module({
  imports: [GrpcClientsModule],
  controllers: [AuthMeGatewayController],
  providers: [GatewayIdentityService],
  exports: [GatewayIdentityService],
})
export class GatewayAuthModule {}
