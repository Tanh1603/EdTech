import { verifyToken } from '@clerk/backend';
import { status } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function getGrpcUserId(metadata: Metadata): string {
  const userId = metadata.get('x-user-id')[0];

  if (typeof userId === 'string' && userId.length > 0) {
    return userId;
  }

  throw new RpcException({
    code: status.UNAUTHENTICATED,
    message: 'Missing x-user-id metadata',
  });
}

export async function getAuthenticatedGrpcUserId(
  metadata: Metadata,
): Promise<string> {
  const userId = getGrpcUserId(metadata);
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

  return userId;
}
