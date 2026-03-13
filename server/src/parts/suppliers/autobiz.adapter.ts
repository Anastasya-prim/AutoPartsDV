import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserPoolService } from '../browser-pool.service';
import { BaseSupplierAdapter } from './base.adapter';
import { SupplierSearchResult } from './supplier-adapter.interface';

/**
 * AutoBiz — autobiz.ru.
 *
 * Сайт защищён Yandex SmartCaptcha — автоматический парсинг заблокирован.
 * URL поиска: autobiz.ru/search?q={article}
 * API: autobiz.ru/api.html (контакт: newautobiz@autobiz.ru)
 *
 * Пока CAPTCHA не обходится — возвращаем пустой массив.
 */
@Injectable()
export class AutoBizAdapter extends BaseSupplierAdapter {
  readonly supplierId = 'autobiz';
  protected readonly displayName = 'AutoBiz';

  constructor(config: ConfigService, browserPool: BrowserPoolService) {
    super(config, browserPool);
  }

  protected async doSearch(_article: string): Promise<SupplierSearchResult[]> {
    this.logger.warn(
      `[${this.supplierId}] Сайт autobiz.ru защищён Yandex SmartCaptcha. ` +
      `Автоматический парсинг невозможен. Свяжитесь с newautobiz@autobiz.ru для API-доступа.`,
    );
    return [];
  }
}
