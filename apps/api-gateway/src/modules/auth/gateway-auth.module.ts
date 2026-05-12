import { Module } from '@nestjs/common';
import { GatewayIdentityService } from './gateway-identity.service';

@Module({
  providers: [GatewayIdentityService],
  exports: [GatewayIdentityService],
})
export class GatewayAuthModule {}
