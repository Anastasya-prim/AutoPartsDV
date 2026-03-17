/**
 * Корневой модуль приложения — связывает все модули воедино.
 *
 * NestJS строит приложение из «модулей». Каждый модуль отвечает за свою
 * предметную область (авторизация, поиск запчастей, поставщики и т.д.).
 * Здесь мы просто перечисляем их в imports, чтобы NestJS «увидел» все
 * контроллеры, сервисы и провайдеры.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartsModule } from './parts/parts.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { HistoryModule } from './history/history.module';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    // ConfigModule читает .env и делает переменные доступными через ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // Лимит запросов по IP (для auth — строже, задаётся в AuthController)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),

    PrismaModule,       // Подключение к SQLite через Prisma ORM
    MailModule,          // Email-уведомления через UniSender
    AuthModule,          // Регистрация, вход, JWT-токены
    UsersModule,         // Сервис поиска пользователей
    PartsModule,         // Поиск запчастей + агрегация от поставщиков
    SuppliersModule,     // CRUD поставщиков (админ-панель)
    HistoryModule,       // История поисковых запросов пользователя
    ProfileModule,       // Профиль пользователя (просмотр и редактирование)
  ],
})
export class AppModule {}
