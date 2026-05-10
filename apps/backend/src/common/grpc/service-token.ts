import { status } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function assertServiceToken(metadata?: Metadata): void {
  const expected = process.env.SERVICE_TOKEN;

  if (!expected) {
    return;
  }

  const received = metadata?.get('x-service-token')?.[0];

  if (received !== expected) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Invalid service token',
    });
  }
}
