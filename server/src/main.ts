/**
 * Точка входа серверного приложения.
 *
 * Здесь происходит:
 * 1. Загрузка переменных окружения из .env (через dotenv)
 * 2. Создание NestJS-приложения на базе Express
 * 3. Подключение глобальных фильтров (ошибки Prisma), пайпов (валидация DTO)
 * 4. Запуск HTTP-сервера на указанном порту
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  // Без секрета JWT невозможно выпускать и проверять токены — запуск бессмысленен
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не задан в .env — сервер не может запуститься');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS: только с указанного фронтенда (в проде — ваш домен из .env)
  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  // Фильтр ловит ошибки Prisma (P2002, P2025...) и возвращает понятные HTTP-ответы
  app.useGlobalFilters(new PrismaExceptionFilter());

  // ValidationPipe автоматически проверяет тело запроса по DTO-классам:
  //   transform  — приведёт типы (строка "1" → число 1)
  //   whitelist  — удалит поля, которых нет в DTO
  //   forbidNonWhitelisted — вернёт 400, если пришли лишние поля
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Раздаём public/ от корня приложения (и в dev, и в Docker: cwd = server/ или /app)
  app.useStaticAssets(path.join(process.cwd(), 'public'));
  
  const PORT = Number(process.env.PORT) || 4000;
  // 0.0.0.0 — чтобы контейнер принимал соединения от Nginx/Docker-сети, не только localhost
  await app.listen(PORT, '0.0.0.0');
  console.log(`\nNestJS сервер запущен: http://0.0.0.0:${PORT}`);
}
bootstrap().catch((err) => {
  console.error('[bootstrap]', err);
  process.exit(1);
});
