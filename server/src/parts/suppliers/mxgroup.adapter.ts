import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * MX Group — zakaz.mxgroup.ru.
 *
 * B2B-поставщик: требует бизнес-аккаунт и контракт.
 * API: zakaz.mxgroup.ru/mxapi/?m=search&zapros={article}
 * Без логина/пароля — возвращаем пустой массив.
 */
@Injectable()
export class MxGroupAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'mxgroup';
  protected readonly displayName = 'MX Group';

  private readonly login: string;
  private readonly password: string;
  private readonly siteUrl: string;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('MXGROUP_URL', 'https://mxgroup.ru');
    this.login = config.get('MXGROUP_LOGIN', '');
    this.password = config.get('MXGROUP_PASSWORD', '');
  }

  /**
   * Алгоритм парсинга MxGroup:
   * Аналогичен Rossko — логин → поиск → парсинг таблицы.
   * MxGroup — B2B-поставщик, требует бизнес-аккаунт.
   */
  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    if (!this.login || !this.password) {
      this.logger.warn(
        `[${this.supplierId}] Логин/пароль не заданы (MXGROUP_LOGIN, MXGROUP_PASSWORD). ` +
        `Сайт mxgroup.ru требует B2B-авторизацию.`,
      );
      return [];
    }

    return this.withPage(async (page) => {
      await page.goto(`${this.siteUrl}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const loginInput = page.locator('input[name="login"], input[name="email"], input[type="email"]').first();
      const passInput = page.locator('input[name="password"], input[type="password"]').first();

      if (await loginInput.isVisible()) {
        await loginInput.fill(this.login);
        await passInput.fill(this.password);
        await page.locator('button[type="submit"], input[type="submit"]').first().click();
        await page.waitForLoadState('networkidle');
      }

      const searchInput = page.locator('input[name*="search"], input[placeholder*="артикул" i], input[placeholder*="поиск" i]').first();
      await searchInput.fill(article);
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      const results = await page.evaluate(() => {
        const items: any[] = [];
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const text = row.textContent || '';
            const priceMatch = text.match(/(\d[\d\s,.]*)\s*(?:₽|руб|р\.)/i);
            const qtyMatch = text.match(/(\d+)\s*(?:шт|ед)/i);
            items.push({
              article: cells[0]?.textContent?.trim() || '',
              name: cells[1]?.textContent?.trim() || '',
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
          brand: '',
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
