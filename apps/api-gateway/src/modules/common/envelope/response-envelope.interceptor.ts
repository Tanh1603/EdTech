import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestWithContext } from '../types/request-with-context';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithContext>();
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((payload) => {
        if (this.isPaginated(payload)) {
          return {
            success: true,
            data: payload.items,
            meta: {
              requestId: req.requestId ?? 'unknown',
              timestamp,
              pagination: payload.pagination,
            },
            error: null,
          };
        }

        return {
          success: true,
          data: payload,
          meta: {
            requestId: req.requestId ?? 'unknown',
            timestamp,
          },
          error: null,
        };
      }),
    );
  }

  private isPaginated(value: unknown): value is {
    items: unknown[];
    pagination: Record<string, unknown>;
  } {
    return (
      !!value &&
      typeof value === 'object' &&
      Array.isArray((value as { items?: unknown }).items) &&
      !!(value as { pagination?: unknown }).pagination
    );
  }
}
