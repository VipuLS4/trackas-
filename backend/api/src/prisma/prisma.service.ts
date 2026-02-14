import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    if (!process.env.DATABASE_URL?.trim()) {
      const msg = 'DATABASE_URL is not set. Configure it in Railway Variables.';
      console.error('[Prisma]', msg);
      throw new Error(msg);
    }
    try {
      await this.$connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Prisma] Database connection failed:', message);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
