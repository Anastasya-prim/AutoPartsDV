import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * TISS — парсинг сайта my.tiss.ru.
 *
 * Сайт ТРЕБУЕТ авторизацию (OAuth 2.0 / ASP.NET Core Identity).
 * Без логина поиск недоступен.
 *
 * Для работы нужно задать TISS_LOGIN и TISS_PASSWORD в .env.
 * Адаптер сам выполнит вход при первом запросе.
 */
@Injectable()
export class TissAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'tiss';
  protected readonly displayName = 'TISS';

  private readonly siteUrl: string;
  private readonly login: string;
  private readonly password: string;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('TISS_URL', 'https://my.tiss.ru');
    this.login = config.get('TISS_LOGIN', '');
    this.password = config.get('TISS_PASSWORD', '');
  }

  /**
   * Алгоритм парсинга TISS:
   * 1. Переходим на страницу логина (/identity/login)
   * 2. Авторизуемся (ASP.NET Core Identity)
   * 3. Вводим артикул в поисковую строку
   * 4. Парсим таблицу/карточки результатов (цена, количество, сроки доставки)
   */
  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    if (!this.login || !this.password) {
      this.logger.warn(
        `[${this.supplierId}] Логин/пароль не заданы (TISS_LOGIN, TISS_PASSWORD). ` +
        `Сайт my.tiss.ru требует авторизацию.`,
      );
      return [];
    }

    return this.withPage(async (page) => {
      await page.goto(`${this.siteUrl}/identity/login`, { waitUntil: 'networkidle' });

      await page.locator('input[name="Login"]').fill(this.login);
      await page.locator('input[name="Password"]').fill(this.password);
      await page.locator('button[type="submit"]').click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      this.logger.debug(`[${this.supplierId}] Авторизация, URL: ${page.url()}`);

      const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="артикул" i], input[placeholder*="поиск" i], input[placeholder*="номер" i]').first();
      await searchInput.fill(article);
      await searchInput.press('Enter');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      this.logger.debug(`[${this.supplierId}] Результаты поиска, URL: ${page.url()}`);

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
            const daysMatch = text.match(/(\d+)\s*(?:дн|дней|день)/i);

            items.push({
              brand: cells[0]?.textContent?.trim() || '',
              article: cells[1]?.textContent?.trim() || '',
              name: cells[2]?.textContent?.trim() || '',
              price: priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, '').replace(',', '.')) : 0,
              quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 0,
              deliveryDays: daysMatch ? parseInt(daysMatch[1], 10) : 0,
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
          deliveryDays: r.deliveryDays,
          isAnalog: false,
        }));
    });
  }
}
