import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * ![1774958331998](image/am25.adapter/1774958331998.png) — am25.ru.
 *
 * Поиск: GET /price_items/search?oem={артикул}
 * В таблице — производитель, артикул, ссылка на карточку; цены и склады подгружаются на /products/{BRAND}/{ARTICLE}.html
 */
@Injectable()
export class Am25Adapter extends BaseSupplierAdapter {
  readonly supplierId = 'am25';
  protected readonly displayName = 'AM25';

  private readonly siteUrl: string;
  /** AM25 долго отдаёт таблицу поиска — отдельный лимит, иначе обрезает глобальный SUPPLIER_TIMEOUT_MS (15 с). */
  private readonly am25TimeoutMs: number;

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
    this.siteUrl = config.get('AM25_URL', 'https://am25.ru');
    this.am25TimeoutMs = parseInt(
      config.get('AM25_TIMEOUT_MS', '60000'),
      10,
    );
  }

  /** Увеличенный таймаут страницы только для AM25. */
  protected override async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.browserPool.newPage();
    try {
      page.setDefaultTimeout(this.am25TimeoutMs);
      return await fn(page);
    } finally {
      await page.context().close();
    }
  }

  protected async doSearch(article: string): Promise<SupplierSearchResult[]> {
    const q = article.trim();
    if (!q) return [];

    return this.withPage(async (page) => {
      const base = this.siteUrl.replace(/\/+$/, '');
      const searchUrl = `${base}/price_items/search?oem=${encodeURIComponent(q)}`;

      this.logger.debug(`[${this.supplierId}] ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      try {
        await page.waitForFunction(
          () => {
            const body = document.body?.innerText || '';
            const waiting = body.includes('Пожалуйста, подождите');
            const rows = document.querySelectorAll('table tbody tr').length;
            return !waiting || rows > 0;
          },
          { timeout: this.am25TimeoutMs },
        );
      } catch {
        this.logger.warn(
          `[${this.supplierId}] Таймаут ожидания таблицы поиска — парсим текущий DOM`,
        );
      }

      await page.waitForTimeout(3000);

      const searchHits = await page.evaluate(() => {
        const out: { href: string; brand: string; art: string; name: string }[] = [];
        for (const tr of document.querySelectorAll('table tbody tr')) {
          const cells = [...tr.querySelectorAll('td')].map((td) =>
            (td.textContent || '').replace(/\s+/g, ' ').trim(),
          );
          if (cells[0] === 'Производитель') continue;
          if (cells.length < 3) continue;
          const a = tr.querySelector('a[href^="/products/"]');
          if (!a) continue;
          const href = a.getAttribute('href') || '';
          const name =
            (a.textContent || '').replace(/\s+/g, ' ').trim() || cells[2] || '';
          out.push({ href, brand: cells[0], art: cells[1], name });
        }
        return out;
      });

      if (searchHits.length === 0) {
        this.logger.debug(`[${this.supplierId}] Нет строк в таблице поиска`);
        return [];
      }

      const seenUrl = new Set<string>();
      const merged: SupplierSearchResult[] = [];
      const dedupe = new Set<string>();

      for (const hit of searchHits) {
        const fullUrl = hit.href.startsWith('http') ? hit.href : `${base}${hit.href}`;
        if (seenUrl.has(fullUrl)) continue;
        seenUrl.add(fullUrl);

        try {
          await page.goto(fullUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.am25TimeoutMs,
          });
          await page.waitForTimeout(3000);

          const offers = await page.evaluate((requestedRaw: string) => {
            const norm = (s: string) =>
              s.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
            const reqN = norm(requestedRaw);

            function parseDetail(text: string): {
              brand: string;
              article: string;
              name: string;
            } {
              const t = text.trim();
              const mOrig = t.match(/^(\S+)\s+Оригинал\s+(\S+)\s+(.+)$/i);
              if (mOrig) {
                return {
                  brand: mOrig[1],
                  article: mOrig[2],
                  name: mOrig[3].trim(),
                };
              }
              const m2 = t.match(/^([^\s]+)\s+([A-Za-z0-9][\w.-]*)\s+(.+)$/);
              if (m2) {
                return {
                  brand: m2[1],
                  article: m2[2],
                  name: m2[3].trim(),
                };
              }
              return { brand: '', article: '', name: t };
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

            for (const tr of document.querySelectorAll('table tr')) {
              const cells = [...tr.querySelectorAll('td, th')].map((c) =>
                (c.textContent || '').replace(/\s+/g, ' ').trim(),
              );
              const priceCell = cells.find((c) => /Интернет цена/i.test(c));
              if (!priceCell) continue;
              const pm = priceCell.match(/([\d\s]+[.,]\d{2})\s*р/i);
              if (!pm) continue;
              const price = parseFloat(pm[1].replace(/\s/g, '').replace(',', '.'));
              if (!(price > 0)) continue;

              const qtyCell = cells.find((c) => /^Кол\./i.test(c));
              const qm = qtyCell?.match(/Кол\.\s*(\d+)/);
              const quantity = qm ? parseInt(qm[1], 10) : 0;

              const delCell = cells.find((c) => /^Доставка/i.test(c));
              const dm = delCell?.match(/(\d+)\s*дн/i);
              const deliveryDays = dm ? parseInt(dm[1], 10) : 0;

              const detailText = cells[2] || '';
              const { brand, article: art, name } = parseDetail(detailText);
              if (!brand || !name) continue;

              const isAnalog = norm(art) !== reqN;
              out.push({
                brand,
                article: art,
                name,
                price,
                quantity,
                inStock: quantity > 0,
                deliveryDays,
                isAnalog,
                analogFor: isAnalog ? requestedRaw : undefined,
              });
            }
            return out;
          }, q);

          for (const o of offers) {
            const key = `${o.brand}\0${o.article}\0${o.price}\0${o.quantity}\0${o.deliveryDays}`;
            if (dedupe.has(key)) continue;
            dedupe.add(key);
            merged.push(o);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[${this.supplierId}] Карточка ${fullUrl}: ${msg}`);
        }
      }

      return merged;
    });
  }
}
