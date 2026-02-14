import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; version: string } {
    return {
      status: 'ok',
      version: process.env.APP_VERSION ?? '0.0.1',
    };
  }
}
