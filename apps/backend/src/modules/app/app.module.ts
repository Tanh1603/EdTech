import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Joi from 'joi';
import { GrpcServiceAuthGuard } from '../../common/guards/grpc-service-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BackendAuthModule } from '../../common/auth/backend-auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AcademicModule } from '../academic/academic.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ChatModule } from '../chat/chat.module';
import { JobsModule } from '../jobs/jobs.module';
import { LearningModule } from '../learning/learning.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { LoggingInterceptor } from '../../common/grpc/logging.interceptor';

@Module({
  imports: [
    PrismaModule,
    BackendAuthModule,
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
        SERVICE_TOKEN: Joi.string().required(),
        RBAC_BOOTSTRAP_ADMIN_EMAILS: Joi.string().allow('').optional(),
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
      provide: APP_GUARD,
      useClass: GrpcServiceAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggingInterceptor
    // }
  ],
})
export class AppModule {}
