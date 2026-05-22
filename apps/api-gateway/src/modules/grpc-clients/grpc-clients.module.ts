import { Module } from '@nestjs/common';
import {
  AllGrpcPackages,
  GrpcPackages,
  getAllProtoPaths,
  getProtoRoot,
} from '@edtech/contracts';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import {
  BE_CORE_GRPC_CLIENT,
  BeCoreGrpcClientService,
} from './be-core-grpc-client.service';
import {
  AI_SERVICE_GRPC_CLIENT,
  AiGrpcClientService,
} from './ai-grpc-client.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: BE_CORE_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: [...AllGrpcPackages],
          protoPath: getAllProtoPaths(),
          url: process.env.BE_CORE_GRPC_URL ?? 'localhost:50051',
          loader: {
            includeDirs: [getProtoRoot()],
            keepCase: false,
          },
        },
      },
      {
        name: AI_SERVICE_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: GrpcPackages.ai,
          protoPath: getAllProtoPaths(),
          url: process.env.AI_SERVICE_GRPC_URL ?? 'localhost:50052',
          loader: {
            includeDirs: [getProtoRoot()],
            keepCase: false,
          },
        },
      },
    ]),
  ],
  providers: [BeCoreGrpcClientService, AiGrpcClientService, GrpcMetadataBuilder],
  exports: [BeCoreGrpcClientService, AiGrpcClientService, GrpcMetadataBuilder],
})
export class GrpcClientsModule {}
