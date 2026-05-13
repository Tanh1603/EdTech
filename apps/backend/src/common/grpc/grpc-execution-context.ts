import { Metadata } from '@grpc/grpc-js';
import { ExecutionContext } from '@nestjs/common';

export function getGrpcMetadataFromExecutionContext(
  context: ExecutionContext,
): Metadata | undefined {
  const rpcContext = context.switchToRpc().getContext<unknown>();
  if (isGrpcMetadata(rpcContext)) {
    return rpcContext;
  }

  const metadataArg = context.getArgByIndex<unknown>(1);
  if (isGrpcMetadata(metadataArg)) {
    return metadataArg;
  }

  return undefined;
}

function isGrpcMetadata(value: unknown): value is Metadata {
  return (
    value instanceof Metadata ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as Metadata).get === 'function' &&
      typeof (value as Metadata).set === 'function')
  );
}
