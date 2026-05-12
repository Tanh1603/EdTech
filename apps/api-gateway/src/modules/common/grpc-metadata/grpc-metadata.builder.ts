import { Metadata } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestWithContext } from '../types/request-with-context';
import { RequestContext } from '../types/request-with-context';

@Injectable()
export class GrpcMetadataBuilder {
  constructor(private readonly configService: ConfigService) {}

  build(req: RequestWithContext): Metadata {
    return this.buildFromContext(req.context);
  }

  buildFromContext(context: RequestContext | undefined): Metadata {
    const metadata = new Metadata();
    const serviceToken = this.configService.get<string>('SERVICE_TOKEN');

    if (context?.authorization) metadata.set('authorization', context.authorization);
    if (context?.requestId) metadata.set('x-request-id', context.requestId);
    if (context?.correlationId) metadata.set('x-correlation-id', context.correlationId);
    if (context?.userId) metadata.set('x-user-id', context.userId);
    if (serviceToken) metadata.set('x-service-token', serviceToken);

    return metadata;
  }
}
