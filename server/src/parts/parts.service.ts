/**
 * PartsService — главный сервис бизнес-логики поиска запчастей.
 *
 * Алгоритм работы (для search и findByArticle):
 * 1. Сначала ищем в локальной БД (кэш) — это быстро
 * 2. Если кэш свежий (не старше CACHE_TTL_MINUTES) — возвращаем его
 * 3. Если кэш устарел или пуст — запрашиваем данные у поставщиков
 *    через SupplierAggregatorService (парсинг сайтов через Playwright)
 * 4. Полученные результаты сохраняем в БД в фоне (для будущих запросов)
 * 5. Если поставщики не ответили — возвращаем старый кэш (лучше, чем ничего)
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierAggregatorService } from './supplier-aggregator.service';
import { SupplierSearchResult, SupplierStatus } from './suppliers/supplier-adapter.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PartsService {
  private readonly logger = new Logger(PartsService.name);
  /** Время жизни кэша в миллисекундах (берётся из .env CACHE_TTL_MINUTES) */
  private readonly cacheTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregator: SupplierAggregatorService,
    private readonly config: ConfigService,
  ) {
    const ttlMinutes = parseInt(this.config.get('CACHE_TTL_MINUTES', '30'), 10);
    this.cacheTtlMs = ttlMinutes * 60 * 1000;
  }

  /** Преобразует запись из БД (Prisma) в формат, понятный фронтенду */
  private formatDbResult(p: any) {
    return {
      id: p.id,
      supplier: {
        id: p.supplier.id,
        name: p.supplier.name,
        url: p.supplier.url,
        region: p.supplier.region,
        status: p.supplier.status,
        apiType: p.supplier.apiType,
      },
      brand: p.brand,
      article: p.article,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      inStock: p.inStock === 1,
      deliveryDays: p.deliveryDays,
      isAnalog: p.isAnalog === 1,
      analogFor: p.analogFor,
    };
  }

  /** Преобразует «живой» результат от поставщика в формат для фронтенда */
  private formatAggregatorResult(
    r: SupplierSearchResult & { supplierId: string },
    supplierInfo: Map<string, any>,
  ) {
    const sup = supplierInfo.get(r.supplierId);
    return {
      id: `live-${r.supplierId}-${r.article}-${r.brand}`,
      supplier: sup
        ? { id: sup.id, name: sup.name, url: sup.url, region: sup.region, status: sup.status, apiType: sup.apiType }
        : { id: r.supplierId, name: r.supplierId, url: '', region: '', status: 'online', apiType: 'scraper' },
      brand: r.brand,
      article: r.article,
      name: r.name,
      price: r.price,
      quantity: r.quantity,
      inStock: r.inStock,
      deliveryDays: r.deliveryDays,
      isAnalog: r.isAnalog,
      analogFor: r.analogFor || null,
    };
  }

  /** Проверяет, не устарел ли кэш: берёт самую старую запись и сравнивает с TTL */
  private isCacheFresh(parts: Array<{ updatedAt: Date }>): boolean {
    if (parts.length === 0) return false;
    const oldest = parts.reduce(
      (min, p) => (p.updatedAt < min ? p.updatedAt : min),
      parts[0].updatedAt,
    );
    return Date.now() - oldest.getTime() < this.cacheTtlMs;
  }

  /**
   * Можно ли ответить только из SQLite без живого парсинга.
   * Для поставщиков am25 и autotrade (скрейперы с разными артикулами в выдаче) требуем по одной строке
   * в текущей выборке кэша. Иначе бывает: в БД попали только строки AM25 (name содержит OEM), а AutoTrade
   * с артикулом ST-… не попал в contains — кэш считался полным и агрегатор не вызывался.
   * Остальных онлайн-поставщиков здесь не перечисляем: у кого-то может быть 0 позиций по запросу.
   */
  private async canUseCachedSearchOnly(
    cached: Array<{ supplierId: string; updatedAt: Date }>,
  ): Promise<boolean> {
    if (!this.isCacheFresh(cached) || cached.length === 0) return false;
    const ids = ['am25', 'autotrade'] as const;
    for (const id of ids) {
      const s = await this.prisma.supplier.findUnique({
        where: { id },
        select: { status: true },
      });
      if (s?.status !== 'online') continue;
      if (!cached.some((p) => p.supplierId === id)) return false;
    }
    return true;
  }

  /**
   * Поиск запчастей по текстовому запросу (артикул, бренд или название).
   * Вызывается из GET /api/search?q=...
   * @param q      — поисковый запрос от пользователя
   * @param userId — ID пользователя (если авторизован) для сохранения истории
   */
  async search(q: string, userId?: string) {
    const query = (q || '').trim();
    if (!query) throw new BadRequestException('Параметр q обязателен');
    if (query.length > 100) throw new BadRequestException('Запрос слишком длинный');

    let supplierStatuses: SupplierStatus[] = [];
    let results: any[] = [];

    // Шаг 1: ищем в локальной БД (кэше) по артикулу, названию или бренду
    const cached = await this.prisma.part.findMany({
      where: {
        OR: [
          { article: { contains: query } },
          { name: { contains: query } },
          { brand: { contains: query } },
          { analogFor: { contains: query } },
          { analogFor: { equals: query } },
        ],
      },
      include: { supplier: true },
    });

    // Шаг 2: если кэш свежий и полный (см. canUseCachedSearchOnly) — без парсинга
    if (await this.canUseCachedSearchOnly(cached)) {
      this.logger.log(`Кэш актуален для "${query}" — ${cached.length} записей`);
      results = cached.map((p) => this.formatDbResult(p));
    } else {
      if (!this.isCacheFresh(cached) || cached.length === 0) {
        this.logger.log(
          `Кэш пуст или устарел для "${query}" — запрашиваем поставщиков`,
        );
      } else {
        this.logger.log(
          `Кэш свежий, но не по всем онлайн-поставщикам — запрашиваем поставщиков: "${query}"`,
        );
      }

      try {
        // Шаг 3: запрашиваем все поставщики параллельно через агрегатор
        const { results: liveResults, supplierStatuses: statuses } =
          await this.aggregator.searchAll(query);
        supplierStatuses = statuses;

        if (liveResults.length > 0) {
          const supplierInfo = await this.getSupplierMap();
          results = liveResults.map((r) =>
            this.formatAggregatorResult(r, supplierInfo),
          );

          // Шаг 4: сохраняем в БД в фоне — не блокируем ответ пользователю
          this.cacheResultsInBackground(liveResults, query);
        } else {
          // Поставщики ничего не нашли — вернём старый кэш, если был
          results = cached.map((p) => this.formatDbResult(p));
        }
      } catch (err) {
        this.logger.error(
          `Ошибка агрегации для "${query}": ${err instanceof Error ? err.message : err}`,
        );
        results = cached.map((p) => this.formatDbResult(p));
      }
    }

    // Разделяем результаты: точные совпадения и аналоги (заменители)
    const exact = results.filter((r) => !r.isAnalog);
    const analogs = results.filter((r) => r.isAnalog);

    // Если пользователь авторизован — сохраняем в историю до ответа (иначе гонка с /profile/history)
    if (userId) {
      try {
        await this.saveHistory(userId, query, results.length);
      } catch (err) {
        this.logger.warn(
          `История поиска не сохранена: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return { query, total: results.length, exact, analogs, supplierStatuses };
  }

  /**
   * Поиск запчастей по точному артикулу + подгрузка аналогов из БД.
   * Вызывается из GET /api/parts/:article
   */
  async findByArticle(article: string) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(article);
    } catch {
      throw new BadRequestException('Некорректный артикул');
    }

    let supplierStatuses: SupplierStatus[] = [];
    let offers: any[] = [];
    let analogs: any[] = [];

    const cached = await this.prisma.part.findMany({
      where: { article: decoded },
      include: { supplier: true },
    });

    if (await this.canUseCachedSearchOnly(cached)) {
      const formatted = cached.map((p) => this.formatDbResult(p));
      offers = formatted.filter((r) => !r.isAnalog);
      analogs = formatted.filter((r) => r.isAnalog);
    } else {
      if (!this.isCacheFresh(cached) || cached.length === 0) {
        this.logger.log(
          `Кэш пуст или устарел для артикула "${decoded}" — запрашиваем поставщиков`,
        );
      } else {
        this.logger.log(
          `Кэш свежий, но не по всем am25/autotrade — запрашиваем поставщиков: "${decoded}"`,
        );
      }

      try {
        const { results: liveResults, supplierStatuses: statuses } =
          await this.aggregator.searchAll(decoded);
        supplierStatuses = statuses;

        if (liveResults.length > 0) {
          const supplierInfo = await this.getSupplierMap();
          const formatted = liveResults.map((r) =>
            this.formatAggregatorResult(r, supplierInfo),
          );
          offers = formatted.filter((r) => !r.isAnalog);
          analogs = formatted.filter((r) => r.isAnalog);

          this.cacheResultsInBackground(liveResults, decoded);
        } else {
          const formatted = cached.map((p) => this.formatDbResult(p));
          offers = formatted.filter((r) => !r.isAnalog);
          analogs = formatted.filter((r) => r.isAnalog);
        }
      } catch (err) {
        this.logger.error(
          `Ошибка агрегации для артикула "${decoded}": ${err instanceof Error ? err.message : err}`,
        );
        const formatted = cached.map((p) => this.formatDbResult(p));
        offers = formatted.filter((r) => !r.isAnalog);
        analogs = formatted.filter((r) => r.isAnalog);
      }
    }

    // Дополнительно ищем аналоги в БД (могли быть закэшированы ранее)
    const analogParts = await this.prisma.part.findMany({
      where: { analogFor: decoded },
      include: { supplier: true },
    });
    const extraAnalogs = analogParts.map((p) => this.formatDbResult(p));
    // Убираем дубли — если аналог уже пришёл от поставщика, не добавляем его снова
    const analogIds = new Set(analogs.map((a) => a.id));
    for (const a of extraAnalogs) {
      if (!analogIds.has(a.id)) {
        analogs.push(a);
      }
    }

    return { article: decoded, offers, analogs, supplierStatuses };
  }

  /** Загружает всех поставщиков из БД в Map для быстрого поиска по ID */
  private async getSupplierMap(): Promise<Map<string, any>> {
    const suppliers = await this.prisma.supplier.findMany();
    return new Map(suppliers.map((s) => [s.id, s]));
  }

  /** Запускает кэширование результатов в фоне (не блокирует основной ответ) */
  private cacheResultsInBackground(
    results: Array<SupplierSearchResult & { supplierId: string }>,
    searchedArticle: string,
  ) {
    this.doCacheResults(results, searchedArticle).catch((err) => {
      this.logger.error(
        `Фоновое кэширование для "${searchedArticle}" не удалось: ` +
        `${err instanceof Error ? err.message : err}`,
      );
    });
  }

  /**
   * Сохраняет результаты поиска в БД (кэширование).
   * Для каждого результата: если запись уже есть — обновляем, если нет — создаём.
   */
  private async doCacheResults(
    results: Array<SupplierSearchResult & { supplierId: string }>,
    searchedArticle: string,
  ) {
    for (const r of results) {
      // Пропускаем, если поставщика нет в БД (не создаём «висячие» записи)
      const supplierExists = await this.prisma.supplier.findUnique({
        where: { id: r.supplierId },
      });
      if (!supplierExists) continue;

      const artToCache = r.article || searchedArticle;
      const norm = (s: string) =>
        s.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
      /** OEM из поиска, если артикул поставщика другой — чтобы findMany по analogFor находил строку при следующем запросе */
      const analogFor =
        r.analogFor ??
        (norm(artToCache) !== norm(searchedArticle) ? searchedArticle : null);
      // Проверяем, есть ли уже такая запчасть от этого поставщика
      const existing = await this.prisma.part.findFirst({
        where: {
          supplierId: r.supplierId,
          article: artToCache,
          brand: r.brand,
        },
      });

      if (existing) {
        await this.prisma.part.update({
          where: { id: existing.id },
          data: {
            name: r.name,
            price: r.price,
            quantity: r.quantity,
            inStock: r.inStock ? 1 : 0,
            deliveryDays: r.deliveryDays,
            isAnalog: r.isAnalog ? 1 : 0,
            analogFor,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.part.create({
          data: {
            id: uuid(),
            supplierId: r.supplierId,
            brand: r.brand || 'N/A',
            article: artToCache,
            name: r.name || 'Без названия',
            price: r.price,
            quantity: r.quantity,
            inStock: r.inStock ? 1 : 0,
            deliveryDays: r.deliveryDays,
            isAnalog: r.isAnalog ? 1 : 0,
            analogFor,
          },
        });
      }
    }

    this.logger.log(`Закэшировано ${results.length} записей для "${searchedArticle}"`);
  }

  /**
   * Сохраняет поисковый запрос в историю пользователя.
   * Дедупликация: если такой же запрос был менее 5 секунд назад — не дублируем.
   */
  private async saveHistory(userId: string, query: string, resultsCount: number) {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const duplicate = await this.prisma.searchHistory.findFirst({
      where: {
        userId,
        query,
        createdAt: { gte: fiveSecondsAgo },
      },
    });

    if (!duplicate) {
      await this.prisma.searchHistory.create({
        data: {
          id: uuid(),
          userId,
          query,
          resultsCount,
        },
      });
    }
  }
}
