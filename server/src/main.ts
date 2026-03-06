import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  // Статика для теста API
  app.useStaticAssets(path.join(__dirname, '..', 'public'));
  
  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  console.log(`\nNestJS сервер запущен: http://localhost:${PORT}`);
}
bootstrap();
