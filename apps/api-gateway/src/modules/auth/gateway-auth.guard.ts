import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithContext } from '../common/types/request-with-context';
import { GatewayIdentityService } from './gateway-identity.service';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);

  constructor(private readonly identityService: GatewayIdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
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

      request.user = { id: identity.userId };
      request.context = {
        requestId: request.requestId ?? 'unknown',
        correlationId: request.correlationId ?? request.requestId ?? 'unknown',
        userId: identity.userId,
        authorization: identity.authorization,
      };

      this.logger.log(
        `[${requestId}] auth.ok user=${identity.userId} route=${request.method} ${request.originalUrl}`,
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
