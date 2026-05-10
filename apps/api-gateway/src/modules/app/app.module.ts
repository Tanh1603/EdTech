import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Joi from 'joi';
import { AcademicGatewayModule } from '../academic/academic-gateway.module';
import { GatewayAuthGuard } from '../auth/gateway-auth.guard';
import { GatewayErrorFilter } from '../common/error-mapping/gateway-error.filter';
import { ResponseEnvelopeInterceptor } from '../common/envelope/response-envelope.interceptor';
import { RequestContextMiddleware } from '../common/request-context/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().optional(),
        BE_CORE_GRPC_URL: Joi.string().default('localhost:50051'),
        CLERK_PUBLISHABLE_KEY: Joi.string().optional(),
        CLERK_SECRET_KEY: Joi.string().required(),
        SERVICE_TOKEN: Joi.string().optional(),
      }),
      isGlobal: true,
    }),
    AcademicGatewayModule,
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
