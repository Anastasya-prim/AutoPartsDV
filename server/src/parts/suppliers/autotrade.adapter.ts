import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * AutoTrade — парсинг autotrade.su/vladivostok.
 *
 * Не SPA, серверный рендеринг.
 * Прямой URL поиска: /vladivostok/find/{article_без_дефисов}
 * Результаты — карточки .card.cart-item.
 */
@Injectable()
export class AutoTradeAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'autotrade';
  protected readonly displayName = 'AutoTrade';

  private readonly siteUrl: string;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('AUTOTRADE_URL', 'https://autotrade.su/vladivostok');
  }

  /**
   * Алгоритм парсинга AutoTrade:
   * 1. Формируем прямой URL: /vladivostok/find/{артикул_без_дефисов}
   * 2. Ждём загрузки страницы (серверный рендеринг, не SPA)
   * 3. Парсим карточки товаров (.card.cart-item) — название, цена, наличие
   */
  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    return this.withPage(async (page) => {
      // AutoTrade не использует дефисы в артикулах при поиске
      const cleanArticle = article.replace(/-/g, '');
      const searchUrl = `${this.siteUrl}/find/${encodeURIComponent(cleanArticle)}`;

      this.logger.debug(`[${this.supplierId}] Переход: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const results = await page.evaluate(() => {
        const items: any[] = [];
        const cards = document.querySelectorAll('.card.cart-item');

        cards.forEach((card) => {
          const nameEl = card.querySelector('h2.product-info-title-block a, .product-info-title-block a');
          const articleEl = card.querySelector('.article-content');
          const brandEl = card.querySelector('.brand-content, a.brand-content');
          const priceEl = card.querySelector('.cost');
          const qtyEl = card.querySelector('.cell.shrink.padding-left-2');

          const name = nameEl?.textContent?.trim() || '';
          const art = articleEl?.textContent?.trim() || '';
          const brand = brandEl?.textContent?.trim() || '';

          let price = 0;
          if (priceEl) {
            const raw = priceEl.textContent?.replace(/[^\d.,]/g, '') || '';
            price = parseFloat(raw.replace(',', '.')) || 0;
          }

          let quantity = 0;
          let inStock = false;
          if (qtyEl) {
            const qtyText = qtyEl.textContent || '';
            const match = qtyText.match(/(\d+)\s*шт/);
            if (match) {
              quantity = parseInt(match[1], 10);
              inStock = quantity > 0;
            } else if (/наличии/i.test(qtyText)) {
              inStock = true;
              quantity = 1;
            }
          }

          if (name || price > 0) {
            items.push({ brand, article: art, name, price, quantity, inStock });
          }
        });

        return items;
      });

      this.logger.debug(
        `[${this.supplierId}] Найдено карточек: ${results.length}`,
      );

      return results.map((r) => ({
        brand: r.brand,
        article: r.article || article,
        name: r.name,
        price: r.price,
        quantity: r.quantity,
        inStock: r.inStock,
        deliveryDays: 0,
        isAnalog: false,
      }));
    });
  }
}
