/**
 * BrowserPoolService — управление экземпляром браузера Chromium (Playwright).
 *
 * Для парсинга сайтов поставщиков нужен настоящий браузер (многие сайты
 * рендерятся через JavaScript). Этот сервис:
 * - Лениво поднимает Chromium при первом newPage() (в Docker нужен playwright install в образе)
 * - Закрывает при остановке (OnModuleDestroy)
 * - Для каждого запроса создаёт новый контекст (изолированные cookie)
 *   и новую страницу через newPage()
 *
 * Почему headless: true? Браузер работает без GUI — экономит память на сервере.
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

@Injectable()
export class BrowserPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserPoolService.name);
  private browser: Browser | null = null;

  /**
   * Не запускаем Chromium при старте: в Docker-образе нет `playwright install`,
   * синхронный launch блокировал бы bootstrap — HTTP не слушал бы порт (Connection refused).
   * Браузер поднимается лениво в newPage() при первом поиске.
   */
  onModuleInit() {
    this.logger.log('Chromium: ленивый старт при первом запросе к поставщикам');
  }

  /** Закрытие браузера при остановке сервера */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Chromium остановлен');
    }
  }

  /**
   * Создаёт новую страницу браузера в изолированном контексте.
   * Каждый контекст имеет свои cookie — адаптеры не мешают друг другу.
   * User-Agent маскируется под обычный Chrome, чтобы сайты не блокировали бота.
   */
  async newPage(): Promise<Page> {
    if (!this.browser) {
      // В Docker без sandbox Chromium часто падает; без данных адаптеры с withPage дают 0 результатов.
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    const context = await this.browser.newContext({
      // В Alpine/Docker у Chromium часто урезанный набор CA → net::ERR_CERT_AUTHORITY_INVALID
      // на части HTTPS-сайтов. Для скрейпинга известных URL это приемлемо.
      ignoreHTTPSErrors: true,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    return context.newPage();
  }
}
