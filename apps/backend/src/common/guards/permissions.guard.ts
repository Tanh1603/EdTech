import { RolePermission, UserRole } from '@edtech/contracts';
import { status } from '@grpc/grpc-js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { getGrpcMetadataFromExecutionContext } from '../grpc/grpc-execution-context';
import {
  getOptionalStoredGrpcIdentity,
  setGrpcIdentity,
} from '../grpc/grpc-identity.store';
import { getTrustedGrpcIdentity } from '../grpc/metadata.mapper';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RolePermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const identity = this.getRpcIdentity(context);
    if (
      identity.roles.includes(UserRole.admin) ||
      requiredPermissions.some((permission) =>
        identity.permissions.includes(permission),
      )
    ) {
      return true;
    }

    throw new RpcException({
      code: status.PERMISSION_DENIED,
      message: 'Insufficient permission',
    });
  }

  private getRpcIdentity(context: ExecutionContext) {
    if (context.getType() !== 'rpc') {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Insufficient permission',
      });
    }

    const metadata = getGrpcMetadataFromExecutionContext(context);
    if (!metadata) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Missing gRPC metadata',
      });
    }

    const storedIdentity = getOptionalStoredGrpcIdentity(metadata);
    if (storedIdentity) {
      return storedIdentity;
    }

    const identity = getTrustedGrpcIdentity(metadata);
    setGrpcIdentity(metadata, identity);
    return identity;
  }
}
