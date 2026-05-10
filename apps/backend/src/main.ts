import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getAcademicProtoPaths, getProtoRoot } from './common/grpc/proto-paths';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, rawBody: true });
  const grpcUrl = process.env.BACKEND_GRPC_URL ?? '0.0.0.0:50051';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'academic',
      protoPath: getAcademicProtoPaths(),
      url: grpcUrl,
      loader: {
        includeDirs: [getProtoRoot()],
        keepCase: false,
      },
    },
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder().setTitle("EdTech api")
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalResponse().build()

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Backend running at http://localhost:${port}/api`);
  Logger.log(`Backend gRPC running at ${grpcUrl}`);
}

void bootstrap();
