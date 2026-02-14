import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse();

    const requestId =
      (req.headers['x-request-id'] as string) ??
      `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();
    const method = req.method;
    const path = req.route?.path ?? req.path;
    const user = (req as Request & { user?: { id: string; role: string } })
      .user;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.info('request', {
            requestId,
            method,
            path,
            userId: user?.id ?? null,
            role: user?.role ?? null,
            statusCode: res.statusCode,
            durationMs: duration,
          });
        },
        error: (err: Error) => {
          const duration = Date.now() - start;
          this.logger.error('request error', err);
          this.logger.info('request', {
            requestId,
            method,
            path,
            userId: user?.id ?? null,
            role: user?.role ?? null,
            statusCode: 500,
            durationMs: duration,
          });
        },
      }),
    );
  }
}
