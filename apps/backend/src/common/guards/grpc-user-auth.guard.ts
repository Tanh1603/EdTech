import { status } from '@grpc/grpc-js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { getGrpcMetadataFromExecutionContext } from '../grpc/grpc-execution-context';
import {
  getOptionalStoredGrpcIdentity,
  setGrpcIdentity,
} from '../grpc/grpc-identity.store';
import { getTrustedGrpcIdentity } from '../grpc/metadata.mapper';

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

    if (getOptionalStoredGrpcIdentity(metadata)) {
      return true;
    }

    setGrpcIdentity(metadata, getTrustedGrpcIdentity(metadata));
    return true;
  }
}
