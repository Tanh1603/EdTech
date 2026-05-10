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
