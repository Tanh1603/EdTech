import { verifyToken } from '@clerk/backend';
import { status } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { UserRole } from '@edtech/contracts';
import { RpcException } from '@nestjs/microservices';
import {
  extractUserRolesFromClaims,
  normalizeUserRoles,
} from '../auth/roles.util';
import { getStoredGrpcIdentity } from './grpc-identity.store';

export interface GrpcIdentity {
  userId: string;
  roles: UserRole[];
}

export function getGrpcUserId(metadata: Metadata): string {
  return getGrpcIdentity(metadata).userId;
}

export function getGrpcIdentity(metadata: Metadata): GrpcIdentity {
  return getStoredGrpcIdentity(metadata);
}

export function getGrpcMetadataUserId(metadata: Metadata): string {
  const userId = metadata.get('x-user-id')[0];

  if (typeof userId === 'string' && userId.length > 0) {
    return userId;
  }

  throw new RpcException({
    code: status.UNAUTHENTICATED,
    message: 'Missing x-user-id metadata',
  });
}

export async function verifyAuthenticatedGrpcIdentity(
  metadata: Metadata,
): Promise<GrpcIdentity> {
  const userId = getGrpcMetadataUserId(metadata);
  const authorization = metadata.get('authorization')[0];

  if (typeof authorization !== 'string' || authorization.length === 0) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Missing authorization metadata',
    });
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Invalid authorization metadata',
    });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Missing Clerk secret key',
    });
  }

  const payload = await verifyToken(token, { secretKey });
  if (payload.sub !== userId) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Token subject does not match x-user-id metadata',
    });
  }

  const tokenRoles = extractUserRolesFromClaims(payload);
  const headerRoles = normalizeUserRoles(metadata.get('x-user-roles')[0]);
  if (headerRoles.length > 0 && !sameRoles(tokenRoles, headerRoles)) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Token roles do not match x-user-roles metadata',
    });
  }

  return { userId, roles: tokenRoles };
}

function sameRoles(left: UserRole[], right: UserRole[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((role) => rightSet.has(role));
}
