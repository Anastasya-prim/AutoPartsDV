import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * TrustAuto — парсинг сайта trustautovl.ru.
 *
 * На момент проверки (март 2026) поиск на сайте отключён:
 * "Извините, но модуль поиска временно недоступен".
 *
 * У сайта есть REST API (trustautovl.ru/api/), но он требует авторизацию.
 * Контакт для получения доступа: sales@trustautovl.ru, +7 (423) 279-05-05.
 *
 * Адаптер попытается выполнить поиск на сайте; если модуль
 * всё ещё недоступен — вернёт пустой массив и залогирует предупреждение.
 */
@Injectable()
export class TrustAutoAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'trustauto';
  protected readonly displayName = 'TrustAuto';

  private readonly siteUrl: string;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('TRUSTAUTO_URL', 'https://trustautovl.ru');
  }

  /**
   * Алгоритм парсинга TrustAuto:
   * 1. Переходим на /search/?q={артикул}
   * 2. Проверяем, не отключён ли модуль поиска на сайте
   * 3. Если работает — парсим таблицу результатов
   */
  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    return this.withPage(async (page) => {
      await page.goto(
        `${this.siteUrl}/search/?q=${encodeURIComponent(article)}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');
      if (bodyText?.includes('временно недоступен') || bodyText?.includes('unavailable')) {
        this.logger.warn(
          `[${this.supplierId}] Модуль поиска на сайте по-прежнему недоступен`,
        );
        return [];
      }

      this.logger.debug(`[${this.supplierId}] Страница загружена: ${page.url()}`);

      const results = await page.evaluate(() => {
        const items: any[] = [];
        const rows = document.querySelectorAll(
          'table tbody tr, .search-result, .product-item, [class*="result"], [class*="product"]'
        );

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          const text = row.textContent || '';

          if (cells.length >= 3 && /\d/.test(text)) {
            const priceMatch = text.match(/(\d[\d\s,.]*)\s*(?:₽|руб|р\.)/i);
            const qtyMatch = text.match(/(\d+)\s*(?:шт|ед)/i);

            items.push({
              brand: cells[0]?.textContent?.trim() || '',
              article: cells[1]?.textContent?.trim() || '',
              name: cells[2]?.textContent?.trim() || '',
              price: priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, '').replace(',', '.')) : 0,
              quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 0,
            });
          }
        });

        return items;
      });

      return results
        .filter((r) => r.price > 0 || r.name)
        .map((r) => ({
          brand: r.brand,
          article: r.article || article,
          name: r.name,
          price: r.price,
          quantity: r.quantity,
          inStock: r.quantity > 0,
          deliveryDays: 0,
          isAnalog: false,
        }));
    });
  }
}
