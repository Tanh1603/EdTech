import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { join } from 'path';
import { AppModule } from './modules/app/app.module';
import { createGatewayCorsOptions } from './modules/common/cors/gateway-cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: createGatewayCorsOptions(),
    rawBody: true,
  });

  if (process.env.ENABLE_REALTIME_TEST_CLIENT === 'true') {
    app.use(
      '/realtime-test',
      express.static(join(process.cwd(), 'apps/api-gateway/realtime-test')),
    );
  }

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors(createGatewayCorsOptions());

  const config = new DocumentBuilder()
    .setTitle('EdTech API Gateway')
    .setDescription('Public API Gateway for EdTech client applications')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(port);
  Logger.log(`API Gateway running at http://localhost:${port}/api`);
  Logger.log(`API Gateway Swagger running at http://localhost:${port}/api/docs`);
}

void bootstrap();
