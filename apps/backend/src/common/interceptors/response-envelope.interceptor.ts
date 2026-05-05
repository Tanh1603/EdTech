import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageDto } from '../dto/page.dto';
import { ApiEnvelope } from '../types/api-envelope.type';


@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    const req = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        if (this.isPaginatedResponse(data)) {
          return {
            success: true,
            data: data.items as T,
            meta: {
              requestId: req.requestId ?? 'unknown',
              timestamp,
              pagination: {
                page: data.meta.page,
                limit: data.meta.limit,
                total: data.meta.total,
                totalPages: data.meta.totalPages,
              },
            },
            error: null,
          };
        }

        return {
          success: true,
          data,
          meta: {
            requestId: req.requestId ?? 'unknown',
            timestamp,
          },
          error: null,
        };
      }),
    );
  }

  private isPaginatedResponse(value: unknown): value is PageDto<unknown> {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Record<string, any>;

    return (
      Array.isArray(candidate.items) &&
      candidate.meta &&
      typeof candidate.meta.page === 'number' &&
      typeof candidate.meta.limit === 'number' &&
      typeof candidate.meta.total === 'number' &&
      typeof candidate.meta.totalPages === 'number'
    );
  }
}

