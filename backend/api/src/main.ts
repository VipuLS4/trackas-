import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function validateRequiredEnv() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) missing.push('DATABASE_URL');
  if (!process.env.JWT_SECRET?.trim()) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    const suffix =
      process.env.NODE_ENV === 'production'
        ? ' Cannot start in production.'
        : '';
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.${suffix}`,
    );
  }
}

async function bootstrap() {
  validateRequiredEnv();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
