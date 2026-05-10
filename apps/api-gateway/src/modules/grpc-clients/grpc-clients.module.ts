import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import {
  ACADEMIC_GRPC_CLIENT,
  AcademicGrpcClientService,
} from './academic-grpc-client.service';
import { getAcademicProtoPaths, getProtoRoot } from './proto-paths';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ACADEMIC_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'academic',
          protoPath: getAcademicProtoPaths(),
          url: process.env.BE_CORE_GRPC_URL ?? 'localhost:50051',
          loader: {
            includeDirs: [getProtoRoot()],
            keepCase: false,
          },
        },
      },
    ]),
  ],
  providers: [AcademicGrpcClientService, GrpcMetadataBuilder],
  exports: [AcademicGrpcClientService, GrpcMetadataBuilder],
})
export class GrpcClientsModule {}
