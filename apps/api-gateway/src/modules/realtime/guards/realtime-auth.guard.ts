import { verifyToken } from '@clerk/backend';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { AuthenticatedRealtimeSocket } from '../realtime.types';

@Injectable()
export class RealtimeAuthGuard {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(socket: Socket): Promise<AuthenticatedRealtimeSocket> {
    const token = this.getToken(socket);
    if (!token) {
      throw new UnauthorizedException('Missing realtime auth token');
    }

    const payload = await verifyToken(token, {
      secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });

    socket.data.userId = payload.sub;
    return socket as AuthenticatedRealtimeSocket;
  }

  private getToken(socket: Socket): string | undefined {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken;
    }

    const queryToken = this.firstQueryValue(socket.handshake.query.token);
    if (queryToken) {
      return queryToken;
    }

    const accessToken = this.firstQueryValue(socket.handshake.query.access_token);
    if (accessToken) {
      return accessToken;
    }

    const authorization = socket.handshake.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    const [scheme, token] = header?.split(' ') ?? [];
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }

    return undefined;
  }

  private firstQueryValue(value: string | string[] | undefined): string | undefined {
    const first = Array.isArray(value) ? value[0] : value;
    return first && first.trim().length > 0 ? first : undefined;
  }
}
