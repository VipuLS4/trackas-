import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const START_TIME = Date.now();

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetailed() {
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      database: dbStatus,
      uptimeSeconds,
      version: process.env.APP_VERSION ?? '0.0.1',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
