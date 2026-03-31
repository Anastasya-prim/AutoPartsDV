import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * AM25 — am25.ru.
 *
 * Поиск: /price_items/search?oem={oem без дефисов}.
 * При нескольких производителях — таблица #brand-selection-table, переход по tr[data-url].
 * Цены в table[role="price-data-content-result-table"] (AJAX), извлекаем .sale-price-content.
 *
 * Важно: Nginx proxy_read_timeout для /api должен быть ≥ 90–120 с (см. deploy/nginx*.conf), иначе
 * ответ обрежется, пока Playwright ждёт таблицу.
 */
@Injectable()
export class Am25Adapter extends BaseSupplierAdapter {
  readonly supplierId = 'am25';
  protected readonly displayName = 'AM25';

  private readonly siteUrl: string;
  private readonly am25TimeoutMs: number;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('AM25_URL', 'https://am25.ru');
    this.am25TimeoutMs = parseInt(
      config.get('AM25_TIMEOUT_MS', '60000'),
      10,
    );
  }

  private static normalizeOemForSearch(article: string): string {
    return article.replace(/[\s-]/g, '');
  }

  protected override async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.browserPool.newPage();
    try {
      page.setDefaultTimeout(this.am25TimeoutMs);
      return await fn(page);
    } finally {
      await page.context().close();
    }
  }

  private async waitForAm25SearchUi(page: Page): Promise<void> {
    try {
      await page.waitForFunction(
        () => {
          const body = document.body?.innerText || '';
          if (body.includes('Пожалуйста, подождите')) return false;
          return !!(
            document.querySelector('#brand-selection-table') ||
            document.querySelector('table[role="price-data-content-result-table"]')
          );
        },
        { timeout: this.am25TimeoutMs },
      );
    } catch {
      this.logger.warn(
        `[${this.supplierId}] Таймаут ожидания UI поиска — продолжаем`,
      );
    }
  }

  /**
   * Промежуточная страница: выбор бренда. source_oem — как в браузере (часто с дефисами).
   */
  private async openProductPageFromBrandTable(
    page: Page,
    base: string,
    sourceOemForUrl: string,
  ): Promise<void> {
    const brandRow = await page.$('#brand-selection-table tr[data-url^="/products/"]');
    const hasPriceAlready = await page.$(
      'table[role="price-data-content-result-table"] .sale-price-content',
    );
    if (!brandRow || hasPriceAlready) return;

    const dataUrl = await page
      .$eval('#brand-selection-table tr[data-url^="/products/"]', (el) =>
        el.getAttribute('data-url'),
      )
      .catch(() => null);

    if (!dataUrl) return;

    const productUrl = new URL(dataUrl, base);
    if (!productUrl.searchParams.has('source_oem')) {
      productUrl.searchParams.set('source_oem', sourceOemForUrl);
    }
    this.logger.debug(
      `[${this.supplierId}] выбор бренда → ${productUrl.pathname}${productUrl.search}`,
    );
    await page.goto(productUrl.toString(), { waitUntil: 'domcontentloaded' });
  }

  /** Одно ожидание: таблица результатов + появились цены (AJAX). */
  private async waitForPriceTableReady(page: Page): Promise<void> {
    await page
      .waitForSelector('table[role="price-data-content-result-table"]', {
        timeout: this.am25TimeoutMs,
      })
      .catch(() => undefined);

    try {
      await page.waitForSelector(
        'table[role="price-data-content-result-table"] .sale-price-content',
        { timeout: this.am25TimeoutMs },
      );
    } catch {
      this.logger.warn(
        `[${this.supplierId}] Нет .sale-price-content за ${this.am25TimeoutMs}ms`,
      );
    }
  }

  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    const q = article.trim();
    if (!q) return [];

    return this.withPage(async (page) => {
      const base = this.siteUrl.replace(/\/+$/, '');
      const oemSearch = Am25Adapter.normalizeOemForSearch(q);
      const searchUrl = `${base}/price_items/search?oem=${encodeURIComponent(oemSearch)}`;

      this.logger.debug(`[${this.supplierId}] ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      await this.waitForAm25SearchUi(page);
      // Как на сайте: source_oem с дефисами (если пользователь так ввёл)
      await this.openProductPageFromBrandTable(page, base, q);

      await this.waitForPriceTableReady(page);
      await new Promise((r) => setTimeout(r, 800));

      const merged = await page.evaluate((requestedRaw: string) => {
        const norm = (s: string) =>
          s.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
        const reqN = norm(requestedRaw);

        function parseDelivery(text: string): number {
          const t = (text || '').trim();
          if (/сегодня|сейчас|в\s+наличии/i.test(t)) return 0;
          const m = t.match(/(\d+)\s*дн/i);
          return m ? parseInt(m[1], 10) : 0;
        }

        const out: Array<{
          brand: string;
          article: string;
          name: string;
          price: number;
          quantity: number;
          inStock: boolean;
          deliveryDays: number;
          isAnalog: boolean;
          analogFor?: string;
        }> = [];

        const dedupe = new Set<string>();

        const table = document.querySelector(
          'table[role="price-data-content-result-table"]',
        );
        if (!table) return out;

        const rowIter = table.querySelectorAll('tbody tr');

        for (const tr of rowIter) {
          if (tr.getAttribute('role') === 'cross_group_cap') continue;

          const priceSpan = tr.querySelector<HTMLElement>(
            '.sale-price-content, .b-f2-price .sale-price-content',
          );
          if (!priceSpan) continue;

          const priceText = priceSpan.innerText || priceSpan.textContent || '';
          if (/по\s+запросу|цена\s+по\s+запросу/i.test(priceText)) continue;

          const pm = priceText.match(/([\d\s\u00A0]+[.,]\d{2})/);
          if (!pm) continue;

          const price = parseFloat(
            pm[1].replace(/\s/g, '').replace(/\u00A0/g, '').replace(',', '.'),
          );
          if (!(price > 0)) continue;

          const makeTd = tr.querySelector('td[data-make-name]');
          let brand = (makeTd?.getAttribute('data-make-name') || '').trim();
          if (!brand) {
            const pn = tr.querySelector('a.b-nep-mstd-pname');
            brand = (pn?.textContent || '').trim();
          }

          const oemA = tr.querySelector('a.b-nep-mstd-oem');
          const art = (oemA?.textContent || '').replace(/\s+/g, ' ').trim();

          let name = '';
          const desc = tr.querySelector('div.b-nep-mstd-sdescript');
          if (desc) {
            name = (desc.textContent || '').replace(/\s+/g, ' ').trim();
          }
          if (!name && brand && art) name = `${brand} ${art}`;

          if (!brand || !art) continue;

          const qtyCell = tr.querySelector(
            'td.b-nep-mstd-8 .b-nep-mstd-amount, td .b-nep-mstd-amount',
          );
          const qtyText = qtyCell?.textContent || '';
          const qm = qtyText.match(/(\d+)/);
          const quantity = qm ? parseInt(qm[1], 10) : 0;

          const delCell = tr.querySelector(
            'td.b-nep-mstd-9 .b-nep-mstd-delivery, td .b-nep-mstd-delivery',
          );
          const deliveryDays = parseDelivery(delCell?.textContent || '');

          const isAnalog = norm(art) !== reqN;

          const row: (typeof out)[0] = {
            brand,
            article: art,
            name: name || art,
            price,
            quantity,
            inStock: quantity > 0,
            deliveryDays,
            isAnalog,
            analogFor: isAnalog ? requestedRaw : undefined,
          };

          const key = `${row.brand}\0${row.article}\0${row.price}\0${row.quantity}\0${row.deliveryDays}`;
          if (dedupe.has(key)) continue;
          dedupe.add(key);
          out.push(row);
        }

        return out;
      }, q);

      if (merged.length === 0) {
        this.logger.warn(
          `[${this.supplierId}] Парсер вернул 0 строк (проверьте таймауты Nginx и AM25_TIMEOUT_MS)`,
        );
      }

      return merged;
    });
  }
}
