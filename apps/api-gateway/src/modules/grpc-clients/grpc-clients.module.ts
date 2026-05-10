import { Module } from '@nestjs/common';
import {
  AllGrpcPackages,
  getAllProtoPaths,
  getProtoRoot,
} from '@edtech/contracts';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import {
  BE_CORE_GRPC_CLIENT,
  BeCoreGrpcClientService,
} from './be-core-grpc-client.service';

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
    ]),
  ],
  providers: [BeCoreGrpcClientService, GrpcMetadataBuilder],
  exports: [BeCoreGrpcClientService, GrpcMetadataBuilder],
})
export class GrpcClientsModule {}
