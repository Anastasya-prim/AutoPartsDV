import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * AM25 — am25.ru.
 *
 * Поиск: GET /price_items/search?oem={артикул} (часто редирект на страницу с таблицей предложений).
 * На текущей вёрстке блок «Интернет цена» есть в строках таблицы результатов; отдельные страницы
 * /products/… часто без этого текста. Парсим строки таблицы на первой загруженной странице.
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
            if (body.includes('Пожалуйста, подождите')) return false;
            const links = [
              ...document.querySelectorAll('table tbody tr a[href^="/products/"]'),
            ];
            return links.some((a) => {
              const h = a.getAttribute('href') || '';
              return /\/products\/[^/]+\/[^/.]+/.test(h);
            });
          },
          { timeout: this.am25TimeoutMs },
        );
      } catch {
        this.logger.warn(
          `[${this.supplierId}] Таймаут ожидания строк таблицы — парсим текущий DOM`,
        );
      }

      await page.waitForTimeout(2000);

      const merged = await page.evaluate((requestedRaw: string) => {
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

        const dedupe = new Set<string>();

        for (const tr of document.querySelectorAll('table tbody tr')) {
          const cells = [...tr.querySelectorAll('td')].map((td) =>
            (td.textContent || '').replace(/\s+/g, ' ').trim(),
          );
          if (cells[0] === 'Производитель') continue;

          const a = tr.querySelector('a[href^="/products/"]');
          if (!a) continue;
          const href = a.getAttribute('href') || '';
          if (!/\/products\/[^/]+\/[^/.]+/.test(href)) continue;

          const priceCell = cells.find((c) => /Интернет цена/i.test(c));
          if (!priceCell) continue;
          const pm = priceCell.match(/([\d\s]+[.,]\d{2})\s*р/i);
          if (!pm) continue;
          const price = parseFloat(pm[1].replace(/\s/g, '').replace(',', '.'));
          if (!(price > 0)) continue;

          const qtyCell = cells.find((c) => /^Кол\./i.test(c));
          const qm = qtyCell?.match(/Кол\.\s*(\d+)/i);
          const quantity = qm ? parseInt(qm[1], 10) : 0;

          const delCell = cells.find((c) => /^Доставка/i.test(c));
          const dm = delCell?.match(/(\d+)\s*дн/i);
          const deliveryDays = dm ? parseInt(dm[1], 10) : 0;

          const detailText =
            cells.find(
              (c) =>
                c.length > 0 &&
                !/Интернет цена/i.test(c) &&
                !/^Кол\./i.test(c) &&
                !/^Доставка/i.test(c) &&
                !/^В корзину/i.test(c) &&
                !/^Склад\b/i.test(c) &&
                /[A-Za-zА-Яа-я0-9]/.test(c) &&
                /\d/.test(c),
            ) || '';

          const { brand, article: art, name } = parseDetail(detailText);
          if (!brand || !name) continue;

          const isAnalog = norm(art) !== reqN;
          const row: (typeof out)[0] = {
            brand,
            article: art,
            name,
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
        this.logger.debug(
          `[${this.supplierId}] Нет строк с «Интернет цена» в таблице поиска`,
        );
      }

      return merged;
    });
  }
}
