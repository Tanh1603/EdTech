import { UserRole } from '@edtech/contracts';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { getGrpcMetadataFromExecutionContext } from '../grpc/grpc-execution-context';
import {
  getOptionalStoredGrpcIdentity,
  setGrpcIdentity,
} from '../grpc/grpc-identity.store';
import { verifyAuthenticatedGrpcIdentity } from '../grpc/metadata.mapper';
import { CurrentUser } from '../types/current-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const roles = await this.getRoles(context);

    if (
      roles.includes(UserRole.admin) ||
      requiredRoles.some((role) => roles.includes(role))
    ) {
      return true;
    }

    throw new ForbiddenException('Insufficient role');
  }

  private async getRoles(context: ExecutionContext): Promise<UserRole[]> {
    if (context.getType() === 'rpc') {
      const metadata = getGrpcMetadataFromExecutionContext(context);
      if (!metadata) {
        return [];
      }

      const storedIdentity = getOptionalStoredGrpcIdentity(metadata);
      if (storedIdentity) {
        return storedIdentity.roles;
      }

      const identity = await verifyAuthenticatedGrpcIdentity(metadata);
      setGrpcIdentity(metadata, identity);
      return identity.roles;
    }

    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    return request.user?.roles ?? [];
  }
}
