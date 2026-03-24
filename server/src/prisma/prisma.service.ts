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

/** URL для SQLite: из DATABASE_URL (Docker: file:./data/autoparts.db) или файл в корне server/ */
function sqliteFileUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv?.startsWith('file:')) {
    return fromEnv;
  }
  return `file:${path.join(process.cwd(), 'autoparts.db')}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: sqliteFileUrl() });
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
