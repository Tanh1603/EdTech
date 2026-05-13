import { AppHttpException } from './../../../common/errors/app-http.exception';
import { ClerkClient, verifyToken } from '@clerk/backend';
import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { extractUserRolesFromClerkUser } from '../../../common/auth/roles.util';
import { CurrentUser } from '../../../common/types/current-user.type';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(req: Request): Promise<CurrentUser> {
    const token = req.headers.authorization?.split(' ').pop();

    if (!token) {
      throw new AppHttpException(
        'UNAUTHORIZED',
        'Missing bearer token',
        HttpStatus.UNAUTHORIZED,
      );    }

    try {
      const tokenPayload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });

      const user = await this.clerkClient.users.getUser(tokenPayload.sub);

      return {
        id: user.id,
        externalUserId: user.externalId ?? user.id,
        email: user.emailAddresses[0]?.emailAddress ?? '',
        status: user.banned ? 'banned' : 'active',
        roles: extractUserRolesFromClerkUser(user),
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
