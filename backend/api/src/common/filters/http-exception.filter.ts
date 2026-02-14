import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitive = ['password', 'secret', 'token', 'authorization'];
    const out = { ...obj };
    for (const key of Object.keys(out)) {
      if (sensitive.some((s) => key.toLowerCase().includes(s))) {
        out[key] = '[REDACTED]';
      }
    }
    return out;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId =
      (req as Request & { requestId?: string }).requestId ?? 'unknown';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const body: Record<string, unknown> =
      typeof message === 'object' && message !== null
        ? (message as Record<string, unknown>)
        : { message };

    if (process.env.NODE_ENV === 'production') {
      (body as Record<string, unknown>).requestId = requestId;
      res.setHeader('X-Request-Id', requestId);
    }

    const safeBody = this.redactSensitive(body);
    this.logger.warn(
      `[${requestId}] ${status} ${req.method} ${req.url} - ${JSON.stringify(safeBody)}`,
    );

    res.status(status).json(body);
  }
}
