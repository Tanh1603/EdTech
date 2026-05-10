import { Module } from '@nestjs/common';
import {
  CoreGrpcPackages,
  getAcademicProtoPaths,
  getAllProtoPaths,
  getProtoRoot,
  GrpcPackages,
} from '@edtech/contracts';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import {
  ACADEMIC_GRPC_CLIENT,
  AcademicGrpcClientService,
} from './academic-grpc-client.service';
import {
  CORE_GRPC_CLIENT,
  CoreGrpcClientService,
} from './core-grpc-client.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ACADEMIC_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: GrpcPackages.academic,
          protoPath: getAcademicProtoPaths(),
          url: process.env.BE_CORE_GRPC_URL ?? 'localhost:50051',
          loader: {
            includeDirs: [getProtoRoot()],
            keepCase: false,
          },
        },
      },
      {
        name: CORE_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: [...CoreGrpcPackages],
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
  providers: [AcademicGrpcClientService, CoreGrpcClientService, GrpcMetadataBuilder],
  exports: [AcademicGrpcClientService, CoreGrpcClientService, GrpcMetadataBuilder],
})
export class GrpcClientsModule {}
