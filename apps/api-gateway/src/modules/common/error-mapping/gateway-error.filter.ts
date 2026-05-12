import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  grpcCodeToErrorCode,
  grpcCodeToHttpStatus,
} from './grpc-status.mapper';
import { RequestWithContext } from '../types/request-with-context';

@Catch()
export class GatewayErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(GatewayErrorFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithContext>();
    const res = ctx.getResponse<Response>();
    const timestamp = new Date().toISOString();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (typeof exception?.code === 'number') {
      statusCode = grpcCodeToHttpStatus(exception.code);
      code = grpcCodeToErrorCode(exception.code);
      message = exception.details || exception.message || message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = this.codeFromHttpStatus(statusCode);
      message = this.messageFromHttpException(exception);
    } else {
      this.logger.error(exception);
    }

    this.logger.warn(
      `[${req.requestId ?? 'unknown'}] error status=${statusCode} code=${code} route=${req.method} ${req.originalUrl} message=${message}`,
    );

    res.status(statusCode).json({
      success: false,
      data: null,
      meta: {
        requestId: req.requestId ?? 'unknown',
        timestamp,
      },
      error: { code, message },
    });
  }

  private codeFromHttpStatus(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (statusCode === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (statusCode === HttpStatus.NOT_FOUND) return 'RESOURCE_NOT_FOUND';
    if (statusCode === HttpStatus.CONFLICT) return 'CONFLICT';
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
  }

  private messageFromHttpException(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    const message = (response as { message?: string | string[] })?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message ?? exception.message;
  }
}
