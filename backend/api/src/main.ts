import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;

validateRequiredEnv();

function validateRequiredEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV) {
    const val = process.env[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      missing.push(key);
      console.error(`[env] Missing or empty: ${key}`);
    }
  }

  if (missing.length > 0) {
    const msg = `Cannot start: required environment variables not set: ${missing.join(', ')}. Set them in Railway dashboard (Variables) or .env.`;
    console.error('[env]', msg);
    process.exit(1);
  }
}

function getPort(): number {
  const raw = process.env.PORT ?? '3000';
  const port = typeof raw === 'string' ? parseInt(raw, 10) : raw;
  return Number.isFinite(port) ? port : 3000;
}

function setupProcessHandlers() {
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[unhandledRejection]', reason);
  });

  process.on('uncaughtException', (err: Error) => {
    console.error('[uncaughtException]', err);
    process.exit(1);
  });
}

async function bootstrap() {
  setupProcessHandlers();

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const port = getPort();
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[bootstrap] Failed to start:', msg);
  if (String(msg).includes('DATABASE_URL') || (err as { code?: string })?.code === 'P1012') {
    console.error('[bootstrap] Ensure DATABASE_URL is set in Railway Variables.');
  }
  process.exit(1);
});
