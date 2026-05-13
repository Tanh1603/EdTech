import { status } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import type { GrpcIdentity } from './metadata.mapper';

const grpcIdentities = new WeakMap<Metadata, GrpcIdentity>();

export function setGrpcIdentity(
  metadata: Metadata,
  identity: GrpcIdentity,
): void {
  grpcIdentities.set(metadata, identity);
}

export function getStoredGrpcIdentity(metadata: Metadata): GrpcIdentity {
  const identity = grpcIdentities.get(metadata);

  if (!identity) {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Missing authenticated gRPC identity',
    });
  }

  return identity;
}

export function getOptionalStoredGrpcIdentity(
  metadata: Metadata,
): GrpcIdentity | undefined {
  return grpcIdentities.get(metadata);
}
