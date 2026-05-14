import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GatewayIdentityService } from '../../auth/gateway-identity.service';
import { AuthenticatedRealtimeSocket } from '../realtime.types';

@Injectable()
export class RealtimeAuthGuard {
  constructor(private readonly identityService: GatewayIdentityService) {}

  async authenticate(socket: Socket): Promise<AuthenticatedRealtimeSocket> {
    try {
      const identity = await this.identityService.verifySocket(socket);
      socket.data.userId = identity.userId;
      socket.data.roles = identity.roles;
      socket.data.permissions = identity.permissions;
      socket.data.requestId = socket.id;
      socket.data.correlationId = socket.id;
      return socket as AuthenticatedRealtimeSocket;
    } catch {
      throw new UnauthorizedException('Missing realtime auth token');
    }
  }
}
