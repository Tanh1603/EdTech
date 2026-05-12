import { verifyToken } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestWithContext } from '../common/types/request-with-context';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.headers.authorization;
    const token = authorization?.split(' ').pop();
    const requestId = request.requestId ?? 'unknown';

    if (!token) {
      this.logger.warn(
        `[${requestId}] auth.reject reason=missing_token route=${request.method} ${request.originalUrl}`,
      );
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
      });

      request.user = { id: payload.sub };
      request.context = {
        requestId: request.requestId ?? 'unknown',
        correlationId: request.correlationId ?? request.requestId ?? 'unknown',
        userId: payload.sub,
        authorization,
      };

      this.logger.log(
        `[${requestId}] auth.ok user=${payload.sub} route=${request.method} ${request.originalUrl}`,
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
