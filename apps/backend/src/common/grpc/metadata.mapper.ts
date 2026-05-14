import { status } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { RolePermission, RolePermissions, UserRole } from '@edtech/contracts';
import { RpcException } from '@nestjs/microservices';
import { getStoredGrpcIdentity } from './grpc-identity.store';

export interface GrpcIdentity {
  userId: string;
  roles: UserRole[];
  permissions: RolePermission[];
}

export function getGrpcUserId(metadata: Metadata): string {
  return getGrpcIdentity(metadata).userId;
}

export function getGrpcIdentity(metadata: Metadata): GrpcIdentity {
  return getStoredGrpcIdentity(metadata);
}

export function getTrustedGrpcIdentity(metadata: Metadata): GrpcIdentity {
  return {
    userId: getRequiredStringMetadata(metadata, 'x-user-id'),
    roles: parseRoles(metadata.get('x-user-roles')[0]),
    permissions: parsePermissions(metadata.get('x-user-permissions')[0]),
  };
}

function getRequiredStringMetadata(metadata: Metadata, key: string): string {
  const value = metadata.get(key)[0];

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throw new RpcException({
    code: status.UNAUTHENTICATED,
    message: `Missing ${key} metadata`,
  });
}

function parseRoles(value: string | Buffer | undefined): UserRole[] {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((role) => role.trim())
        .filter((role): role is UserRole =>
          Object.values(UserRole).includes(role as UserRole),
        ),
    ),
  );
}

function parsePermissions(
  value: string | Buffer | undefined,
): RolePermission[] {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((permission) => permission.trim())
        .filter((permission): permission is RolePermission =>
          Object.values(RolePermissions).includes(permission as RolePermission),
        ),
    ),
  );
}
