import { status } from '@grpc/grpc-js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { getGrpcMetadataFromExecutionContext } from '../grpc/grpc-execution-context';
import { assertServiceToken } from '../grpc/service-token';

@Injectable()
export class GrpcServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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

    assertServiceToken(metadata);
    return true;
  }
}
