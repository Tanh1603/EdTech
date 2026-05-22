import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Joi from 'joi';
import { AcademicGatewayModule } from '../academic/academic-gateway.module';
import { GatewayAuthModule } from '../auth/gateway-auth.module';
import { AssessmentsGatewayModule } from '../assessments/assessments-gateway.module';
import { GatewayAuthGuard } from '../auth/gateway-auth.guard';
import { ChatGatewayModule } from '../chat/chat-gateway.module';
import { GatewayErrorFilter } from '../common/error-mapping/gateway-error.filter';
import { ResponseEnvelopeInterceptor } from '../common/envelope/response-envelope.interceptor';
import { RequestContextMiddleware } from '../common/request-context/request-context.middleware';
import { LearningGatewayModule } from '../learning/learning-gateway.module';
import { JobsGatewayModule } from '../jobs/jobs-gateway.module';
import { NotificationsGatewayModule } from '../notifications/notifications-gateway.module';
import { StorageGatewayModule } from '../storage/storage-gateway.module';
import { UsersGatewayModule } from '../users/users-gateway.module';
import { WebhooksGatewayModule } from '../webhooks/webhooks-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().optional(),
        BE_CORE_GRPC_URL: Joi.string().default('localhost:50051'),
        AI_SERVICE_GRPC_URL: Joi.string().default('localhost:50052'),
        CLERK_PUBLISHABLE_KEY: Joi.string().optional(),
        CLERK_SECRET_KEY: Joi.string().required(),
        CLERK_WEBHOOK_SECRET: Joi.string().optional(),
        SERVICE_TOKEN: Joi.string().optional(),
        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
      }),
      isGlobal: true,
    }),
    GatewayAuthModule,
    AcademicGatewayModule,
    AssessmentsGatewayModule,
    ChatGatewayModule,
    LearningGatewayModule,
    JobsGatewayModule,
    NotificationsGatewayModule,
    StorageGatewayModule,
    UsersGatewayModule,
    WebhooksGatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GatewayErrorFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
