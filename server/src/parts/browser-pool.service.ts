/**
 * BrowserPoolService — управление экземпляром браузера Chromium (Playwright).
 *
 * Для парсинга сайтов поставщиков нужен настоящий браузер (многие сайты
 * рендерятся через JavaScript). Этот сервис:
 * - Запускает Chromium один раз при старте сервера (OnModuleInit)
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

  /** Запуск Chromium при старте NestJS-приложения */
  async onModuleInit() {
    try {
      this.browser = await chromium.launch({ headless: true });
      this.logger.log('Chromium запущен');
    } catch (err) {
      this.logger.error(
        `Не удалось запустить Chromium: ${err instanceof Error ? err.message : err}`,
      );
    }
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
      this.browser = await chromium.launch({ headless: true });
    }
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    return context.newPage();
  }
}
