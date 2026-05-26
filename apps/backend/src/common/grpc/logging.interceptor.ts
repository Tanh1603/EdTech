import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {

    const now = Date.now();

    // =========================
    // GRPC CONTEXT
    // =========================

    const rpcContext = context.switchToRpc();

    const data = rpcContext.getData();

    const grpcContext = rpcContext.getContext();

    const metadata =
      rpcContext.getContext<Metadata>();

    const metadataMap =
      metadata?.getMap?.() || {};

    const handler = context.getHandler().name;
    const className = context.getClass().name;

    this.logger.log({
      type: 'GRPC_REQUEST',
      service: className,
      handler,
      metadata: metadataMap,
      payload: data,
    });


    return next.handle().pipe(

      tap((data) => {
        this.logger.log({
          type: 'GRPC_RESPONSE',
          service: className,
          handler,
          data,
          duration: `${Date.now() - now}ms`,
        });
      }),

      catchError((error) => {

        this.logger.error({
          type: 'GRPC_ERROR',
          service: className,
          handler,
          duration: `${Date.now() - now}ms`,
          metadata: metadataMap,
          error: error.message,
        });

        return throwError(() => error);
      }),
    );
  }
}
