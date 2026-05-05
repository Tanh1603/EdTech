import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Request, Response } from 'express';
import { ApiEnvelope, ApiError } from '../types/api-envelope.type';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse<Response>();

    const requestId = req.requestId ?? 'unknown';
    const timestamp = new Date().toISOString();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = this.mapPrismaStatus(exception.code);
      error = {
        code: this.mapPrismaCode(exception.code),
        message: this.mapPrismaMessage(exception.code),
      };
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse() as
        | string
        | { code?: string; message?: string | string[]; details?: string[] };

      if (typeof response === 'string') {
        error = {
          code: this.mapCodeByStatus(statusCode),
          message: response,
        };
      } else {
        const parsedMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : (response.message ?? 'Request failed');

        error = {
          code: response.code ?? this.mapCodeByStatus(statusCode),
          message: parsedMessage,
          details: response.details,
        };
      }
    }

    const payload: ApiEnvelope<null> = {
      success: false,
      data: null,
      meta: {
        requestId,
        timestamp,
      },
      error,
    };

    res.status(statusCode).json(payload);
  }

  private mapCodeByStatus(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (statusCode === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (statusCode === HttpStatus.NOT_FOUND) return 'RESOURCE_NOT_FOUND';
    if (statusCode === HttpStatus.CONFLICT) return 'CONFLICT';
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    if (statusCode >= 500) return 'INTERNAL_ERROR';
    return 'INTERNAL_ERROR';
  }

  private mapPrismaStatus(code: string): number {
    if (code === 'P2002') return HttpStatus.CONFLICT;
    if (code === 'P2025') return HttpStatus.NOT_FOUND;
    if (code === 'P2003') return HttpStatus.BAD_REQUEST;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private mapPrismaCode(code: string): string {
    if (code === 'P2002') return 'CONFLICT';
    if (code === 'P2025') return 'RESOURCE_NOT_FOUND';
    if (code === 'P2003') return 'VALIDATION_ERROR';
    return 'INTERNAL_ERROR';
  }

  private mapPrismaMessage(code: string): string {
    if (code === 'P2002') return 'Resource already exists';
    if (code === 'P2025') return 'Resource not found';
    if (code === 'P2003') return 'Invalid reference data';
    return 'Internal server error';
  }
}

