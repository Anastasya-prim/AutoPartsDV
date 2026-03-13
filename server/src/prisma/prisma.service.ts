/**
 * PrismaService — обёртка над Prisma ORM для работы с SQLite.
 *
 * Prisma — это ORM (Object-Relational Mapping): вместо SQL-запросов
 * мы пишем TypeScript-код (prisma.user.findMany(), prisma.part.create() и т.д.),
 * а Prisma генерирует SQL под капотом.
 *
 * SQLite — файловая БД (autoparts.db). Не требует отдельного сервера.
 * better-sqlite3 — быстрый нативный драйвер для SQLite.
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Путь к файлу БД — autoparts.db в корне папки server/
    const dbPath = path.join(process.cwd(), 'autoparts.db');
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    super({ adapter });
  }

  /** Подключение к БД при старте приложения */
  async onModuleInit() {
    await this.$connect();
  }

  /** Отключение от БД при остановке приложения */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
