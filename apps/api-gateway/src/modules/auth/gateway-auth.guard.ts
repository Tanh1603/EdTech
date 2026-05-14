import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithContext } from '../common/types/request-with-context';
import { GatewayIdentityService } from './gateway-identity.service';
import { IS_PUBLIC_ROUTE } from './public.decorator';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);

  constructor(
    private readonly identityService: GatewayIdentityService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.headers.authorization;
    const requestId = request.requestId ?? 'unknown';

    if (!authorization) {
      this.logger.warn(
        `[${requestId}] auth.reject reason=missing_token route=${request.method} ${request.originalUrl}`,
      );
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const identity = await this.identityService.verifyBearerAuthorization(authorization);

      request.user = {
        id: identity.userId,
        roles: identity.roles,
        permissions: identity.permissions,
      };
      request.context = {
        requestId: request.requestId ?? 'unknown',
        correlationId: request.correlationId ?? request.requestId ?? 'unknown',
        userId: identity.userId,
        roles: identity.roles,
        permissions: identity.permissions,
      };

      this.logger.log(
        `[${requestId}] auth.ok user=${identity.userId} roles=${identity.roles.join(',')} route=${request.method} ${request.originalUrl}`,
      );

      return true;
    } catch (error) {
      this.logger.warn(
        `[${requestId}] auth.reject reason=invalid_token route=${request.method} ${request.originalUrl} message=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }
}
