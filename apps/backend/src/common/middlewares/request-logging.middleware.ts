import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(
    req: Request & { requestId?: string; user?: { id?: string } },
    res: Response,
    next: NextFunction,
  ): void {
    const startedAt = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const latencyMs = Date.now() - startedAt;
      this.logger.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'backend',
        requestId: req.requestId ?? 'unknown',
        route: originalUrl,
        method,
        actorUserId: req.user?.id ?? null,
        latencyMs,
        statusCode: res.statusCode,
      });
    });

    next();
  }
}

