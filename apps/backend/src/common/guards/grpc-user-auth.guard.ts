import { status } from '@grpc/grpc-js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { getGrpcMetadataFromExecutionContext } from '../grpc/grpc-execution-context';
import { setGrpcIdentity } from '../grpc/grpc-identity.store';
import { verifyAuthenticatedGrpcIdentity } from '../grpc/metadata.mapper';

@Injectable()
export class GrpcUserAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'rpc') {
      return true;
    }

    const metadata = getGrpcMetadataFromExecutionContext(context);
    if (!metadata) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Missing gRPC metadata',
      });
    }

    const identity = await verifyAuthenticatedGrpcIdentity(metadata);
    setGrpcIdentity(metadata, identity);
    return true;
  }
}
