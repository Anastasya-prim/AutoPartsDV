import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * Rossko — ussuri.rossko.ru.
 *
 * Сайт требует авторизацию для поиска.
 * API (api.rossko.ru) требует ключи KEY1/KEY2.
 * Пока credentials не указаны — возвращаем пустой массив.
 */
@Injectable()
export class RosskoAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'rossko';
  protected readonly displayName = 'Rossko';

  private readonly login: string;
  private readonly password: string;
  private readonly siteUrl: string;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('ROSSKO_URL', 'https://ussuri.rossko.ru');
    this.login = config.get('ROSSKO_LOGIN', '');
    this.password = config.get('ROSSKO_PASSWORD', '');
  }

  /**
   * Алгоритм парсинга Rossko:
   * 1. Открываем сайт → если есть форма логина — авторизуемся
   * 2. Вводим артикул в поле поиска и нажимаем Enter
   * 3. Парсим таблицу результатов: ищем цену через регулярку (\d₽), кол-во (\dшт)
   */
  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    if (!this.login || !this.password) {
      this.logger.warn(
        `[${this.supplierId}] Логин/пароль не заданы (ROSSKO_LOGIN, ROSSKO_PASSWORD). ` +
        `Сайт ussuri.rossko.ru требует авторизацию для поиска.`,
      );
      return [];
    }

    return this.withPage(async (page) => {
      await page.goto(this.siteUrl, { waitUntil: 'domcontentloaded' });

      const emailInput = page.locator('input[name="auth[email]"]');
      const passInput = page.locator('input[name="auth[password]"]');

      if (await emailInput.isVisible()) {
        await emailInput.fill(this.login);
        await passInput.fill(this.password);
        await page.locator('button[type="submit"], input[type="submit"]').first().click();
        await page.waitForLoadState('networkidle');
      }

      const searchInput = page.locator('input[name*="search"], input[placeholder*="артикул" i], input[placeholder*="поиск" i]').first();
      await searchInput.fill(article);
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      // Извлекаем данные из DOM таблицы (выполняется внутри браузера)
      const results = await page.evaluate(() => {
        const items: any[] = [];
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const text = row.textContent || '';
            const priceMatch = text.match(/(\d[\d\s,.]*)\s*(?:₽|руб|р\.)/i);
            const qtyMatch = text.match(/(\d+)\s*(?:шт|ед)/i);
            items.push({
              brand: cells[0]?.textContent?.trim() || '',
              article: cells[1]?.textContent?.trim() || '',
              name: cells[2]?.textContent?.trim() || '',
              price: priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, '')) : 0,
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
