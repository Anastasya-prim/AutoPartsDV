import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * AM25 — SPA-сайт am25.ru.
 *
 * Сайт не отвечает на автоматические запросы (таймаут на networkidle).
 * Возможно, требуется авторизация или блокирует ботов.
 * URL поиска: https://am25.ru/products?search={article}
 *
 * Пока сайт недоступен для автоматики — возвращаем пустой массив.
 */
@Injectable()
export class Am25Adapter extends BaseSupplierAdapter {
  readonly supplierId = 'am25';
  protected readonly displayName = 'AM25';

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
  }

  protected async doSearch(_article: string): Promise<SupplierSearchResult[]> {
    this.logger.warn(
      `[${this.supplierId}] Сайт am25.ru не отвечает на автоматические запросы. ` +
      `Требуется ручная проверка доступности или API-доступ.`,
    );
    return [];
  }
}
