import { verifyToken } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestWithContext } from '../common/types/request-with-context';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.headers.authorization;
    const token = authorization?.split(' ').pop();

    if (!token) {
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

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
