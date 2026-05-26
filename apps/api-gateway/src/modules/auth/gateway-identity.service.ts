import { verifyToken } from '@clerk/backend';
import { parseRbacSnapshot, RolePermission, UserRole } from '@edtech/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

export interface GatewayIdentity {
  userId: string;
  roles: UserRole[];
  permissions: RolePermission[];
}

@Injectable()
export class GatewayIdentityService {
  constructor(private readonly configService: ConfigService) {}

  async verifyBearerAuthorization(authorization: string): Promise<GatewayIdentity> {
    const token = this.extractBearerToken(authorization);
    const payload = await verifyToken(token, {
      secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });

    const snapshot = parseRbacSnapshot(payload);
    if (!snapshot) {
      throw new Error('Missing RBAC snapshot');
    }
    if (snapshot.st !== 'active') {
      throw new Error('User is not active');
    }

    return {
      userId: payload.sub,
      roles: snapshot.r,
      permissions: snapshot.p,
    };
  }

  async verifySocket(socket: Socket): Promise<GatewayIdentity> {
    const authorization = this.getSocketAuthorization(socket);
    if (!authorization) {
      throw new Error('Missing realtime auth token');
    }

    return this.verifyBearerAuthorization(authorization);
  }

  private extractBearerToken(authorization: string): string {
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new Error('Missing bearer token');
    }

    return token;
  }

  private getSocketAuthorization(socket: Socket): string | undefined {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return `Bearer ${authToken.trim()}`;
    }

    const queryToken = this.firstQueryValue(socket.handshake.query.token);
    if (queryToken) {
      return `Bearer ${queryToken}`;
    }

    const accessToken = this.firstQueryValue(socket.handshake.query.access_token);
    if (accessToken) {
      return `Bearer ${accessToken}`;
    }

    const authorization = socket.handshake.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    return header && header.trim().length > 0 ? header : undefined;
  }

  private firstQueryValue(value: string | string[] | undefined): string | undefined {
    const first = Array.isArray(value) ? value[0] : value;
    return first && first.trim().length > 0 ? first.trim() : undefined;
  }

}
