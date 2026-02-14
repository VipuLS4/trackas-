import { Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class LoggerService {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    });
  }

  child(bindings: Record<string, unknown>) {
    return this.logger.child(bindings);
  }

  info(msg: string, obj?: Record<string, unknown>) {
    this.logger.info(obj ?? {}, msg);
  }

  warn(msg: string, obj?: Record<string, unknown>) {
    this.logger.warn(obj ?? {}, msg);
  }

  error(msg: string, err?: Error | Record<string, unknown>) {
    const obj =
      err instanceof Error
        ? { err: { message: err.message, stack: err.stack } }
        : (err ?? {});
    this.logger.error(obj, msg);
  }

  debug(msg: string, obj?: Record<string, unknown>) {
    this.logger.debug(obj ?? {}, msg);
  }
}
