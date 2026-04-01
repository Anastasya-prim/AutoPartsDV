/**
 * BaseSupplierAdapter — базовый класс для всех адаптеров поставщиков.
 *
 * Каждый поставщик (Rossko, MxGroup, AutoTrade и т.д.) наследуется от этого
 * класса и реализует один метод: doSearch(article).
 *
 * Базовый класс предоставляет:
 * - Логирование с замером времени (search → doSearch обёртка)
 * - Управление страницей браузера (withPage — создаёт и закрывает страницу)
 * - Таймаут из .env (SUPPLIER_TIMEOUT_MS, по умолчанию 60 с — при параллельном
 *   запуске нескольких Playwright-поставщиков 15 с часто недостаточно)
 */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { BrowserPoolService } from '../browser-pool.service';
import { SupplierAdapter, SupplierSearchResult } from './supplier-adapter.interface';

export abstract class BaseSupplierAdapter implements SupplierAdapter {
  /** Уникальный ID поставщика (совпадает с supplier.id в БД, например "rossko") */
  abstract readonly supplierId: string;
  /** Человекочитаемое название (для логов) */
  protected abstract readonly displayName: string;

  protected readonly logger: Logger;
  /** Максимальное время ожидания ответа от сайта поставщика (мс) */
  protected readonly timeoutMs: number;

  constructor(
    protected readonly config: ConfigService,
    protected readonly browserPool: BrowserPoolService,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.timeoutMs = parseInt(config.get('SUPPLIER_TIMEOUT_MS', '60000'), 10);
  }

  /**
   * Публичный метод поиска. Оборачивает doSearch() логированием и замером времени.
   * Адаптеры НЕ переопределяют этот метод — они реализуют doSearch().
   */
  async search(article: string): Promise<SupplierSearchResult[]> {
    const start = Date.now();
    this.logger.log(`[${this.supplierId}] Запрос: article="${article}"`);

    try {
      const results = await this.doSearch(article);
      const elapsed = Date.now() - start;
      this.logger.log(
        `[${this.supplierId}] Ответ: ${results.length} результатов за ${elapsed}ms`,
      );
      return results;
    } catch (err) {
      const elapsed = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[${this.supplierId}] Ошибка за ${elapsed}ms: ${message}`,
      );
      throw err;
    }
  }

  /** Каждый адаптер реализует свою логику парсинга здесь */
  protected abstract doSearch(article: string): Promise<SupplierSearchResult[]>;

  /**
   * Вспомогательный метод: создаёт страницу браузера, выполняет fn(page),
   * и гарантированно закрывает контекст после завершения (даже при ошибке).
   */
  protected async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.browserPool.newPage();
    try {
      page.setDefaultTimeout(this.timeoutMs);
      return await fn(page);
    } finally {
      await page.context().close();
    }
  }
}
