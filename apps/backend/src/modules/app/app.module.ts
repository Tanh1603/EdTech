import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Joi from 'joi';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../../common/interceptors/response-envelope.interceptor';
import { RequestIdMiddleware } from '../../common/middlewares/request-id.middleware';
import { RequestLoggingMiddleware } from '../../common/middlewares/request-logging.middleware';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';
import { AcademicModule } from '../academic/academic.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { HealthModule } from '../health/health.module';
import { JobsModule } from '../jobs/jobs.module';
import { LearningModule } from '../learning/learning.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AcademicModule,
    AssessmentsModule,
    LearningModule,
    ChatModule,
    StorageModule,
    JobsModule,
    NotificationsModule,
    ConfigModule.forRoot({
      envFilePath: 'apps/backend/.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        CLERK_PUBLISHABLE_KEY: Joi.string().required(),
        CLERK_SECRET_KEY: Joi.string().required(),
        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        BACKEND_GRPC_URL: Joi.string().optional(),
        SERVICE_TOKEN: Joi.string().optional(),
        ENABLE_BE_HTTP_PUBLIC: Joi.boolean().optional(),
        ENABLE_BE_WORKERS: Joi.boolean().optional(),
        RABBITMQ_URL: Joi.string().optional(),
        RABBITMQ_EXCHANGE: Joi.string().default('edtech.jobs'),
        RABBITMQ_PREFETCH: Joi.number().default(10),
      }),
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    ClerkClientProvider,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
