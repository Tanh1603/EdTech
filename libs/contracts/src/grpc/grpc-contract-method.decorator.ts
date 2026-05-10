import { GrpcMethod } from '@nestjs/microservices';

export function GrpcContractMethod(service: string, method: string): MethodDecorator {
  return GrpcMethod(service, method);
}
