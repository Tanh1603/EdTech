import { Logger, ValidationPipe } from '@nestjs/common';
import {
  AllGrpcPackages,
  getAllProtoPaths,
  getProtoRoot,
} from '@edtech/contracts';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './modules/app/app.module';
import { ReflectionService } from '@grpc/reflection';
import { GrpcExceptionFilter } from './common/grpc/grpc-exception.filter';

async function bootstrap() {
  const grpcUrl = process.env.BACKEND_GRPC_URL ?? '0.0.0.0:50051';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [...AllGrpcPackages],
        protoPath: getAllProtoPaths(),
        url: grpcUrl,
        channelOptions: {
          'grpc.max_receive_message_length': 32 * 1024 * 1024,
          'grpc.max_send_message_length': 32 * 1024 * 1024,
        },
        loader: {
          includeDirs: [getProtoRoot()],
          keepCase: false,
        },
        onLoadPackageDefinition: (pkg, server) => {
          new ReflectionService(pkg).addToServer(server);
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GrpcExceptionFilter());

  await app.listen();
  Logger.log(`Backend gRPC running at ${grpcUrl}`);
}

void bootstrap();
