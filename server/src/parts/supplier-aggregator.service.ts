/**
 * SupplierAggregatorService — «дирижёр» запросов к поставщикам.
 *
 * Когда пользователь ищет запчасть, этот сервис:
 * 1. Берёт список поставщиков из БД
 * 2. Для каждого «онлайн» поставщика находит соответствующий адаптер
 * 3. Запускает лёгкие адаптеры параллельно; AM25 и AutoTrade — по очереди
 *    (один Chromium в пуле, иначе гонка и таймауты).
 * 4. Собирает результаты и статусы (ok / error / skipped) в один ответ
 *
 * Если один поставщик упал — остальные всё равно вернут данные.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SupplierAdapter,
  SupplierSearchResult,
  SupplierStatus,
} from './suppliers/supplier-adapter.interface';
import {
  RosskoAdapter,
  MxGroupAdapter,
  AutoTradeAdapter,
  TissAdapter,
  AutoBizAdapter,
  Am25Adapter,
  TrustAutoAdapter,
} from './suppliers';

/** Тип ответа агрегатора: массив результатов + статусы каждого поставщика */
export interface AggregatedResponse {
  results: Array<SupplierSearchResult & { supplierId: string }>;
  supplierStatuses: SupplierStatus[];
}

@Injectable()
export class SupplierAggregatorService {
  private readonly logger = new Logger(SupplierAggregatorService.name);

  /**
   * Карта: id поставщика → его адаптер.
   * Ключ совпадает с полем supplier.id в БД (например, "rossko", "autotrade").
   */
  private readonly adapters: Map<string, SupplierAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    rosskoAdapter: RosskoAdapter,
    mxGroupAdapter: MxGroupAdapter,
    autoTradeAdapter: AutoTradeAdapter,
    tissAdapter: TissAdapter,
    autoBizAdapter: AutoBizAdapter,
    am25Adapter: Am25Adapter,
    trustAutoAdapter: TrustAutoAdapter,
  ) {
    // Регистрируем все адаптеры вручную (по ID поставщика из БД)
    this.adapters = new Map<string, SupplierAdapter>([
      ['rossko', rosskoAdapter],
      ['mxgroup', mxGroupAdapter],
      ['autotrade', autoTradeAdapter],
      ['tiss', tissAdapter],
      ['autobiz', autoBizAdapter],
      ['am25', am25Adapter],
      ['trustauto', trustAutoAdapter],
    ]);
  }

  /** Поставщики с тяжёлым Playwright — не параллелим между собой */
  private static readonly BROWSER_HEAVY_IDS = new Set(['am25', 'autotrade']);

  /** Запускает поиск по всем поставщикам и собирает результаты */
  async searchAll(article: string): Promise<AggregatedResponse> {
    const suppliers = await this.prisma.supplier.findMany();
    const statuses: SupplierStatus[] = [];
    const allResults: Array<SupplierSearchResult & { supplierId: string }> = [];

    const runOne = async (
      supplier: (typeof suppliers)[number],
    ): Promise<void> => {
      if (supplier.status !== 'online') {
        statuses.push({
          supplierId: supplier.id,
          status: 'skipped',
          responseTimeMs: 0,
          resultsCount: 0,
          error: `Статус: ${supplier.status}`,
        });
        return;
      }

      const adapter = this.adapters.get(supplier.id);
      if (!adapter) {
        this.logger.warn(`Нет адаптера для поставщика "${supplier.id}" — пропуск`);
        statuses.push({
          supplierId: supplier.id,
          status: 'skipped',
          responseTimeMs: 0,
          resultsCount: 0,
          error: 'Адаптер не зарегистрирован',
        });
        return;
      }

      const start = Date.now();
      try {
        const results = await adapter.search(article);
        const elapsed = Date.now() - start;

        for (const r of results) {
          allResults.push({ ...r, supplierId: supplier.id });
        }

        statuses.push({
          supplierId: supplier.id,
          status: 'ok',
          responseTimeMs: elapsed,
          resultsCount: results.length,
        });
      } catch (err) {
        const elapsed = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);

        this.logger.error(
          `Поставщик "${supplier.id}" не ответил (${elapsed}ms): ${message}`,
        );

        statuses.push({
          supplierId: supplier.id,
          status: 'error',
          responseTimeMs: elapsed,
          resultsCount: 0,
          error: message,
        });
      }
    };

    const lightSuppliers = suppliers.filter(
      (s) => !SupplierAggregatorService.BROWSER_HEAVY_IDS.has(s.id),
    );
    const heavyOrdered = (['am25', 'autotrade'] as const)
      .map((id) => suppliers.find((s) => s.id === id))
      .filter((s): s is (typeof suppliers)[number] => s != null);

    await Promise.allSettled(lightSuppliers.map((s) => runOne(s)));
    for (const s of heavyOrdered) {
      await runOne(s);
    }

    this.logger.log(
      `Агрегация завершена: ${allResults.length} результатов от ` +
        `${statuses.filter((s) => s.status === 'ok').length}/${suppliers.length} поставщиков`,
    );

    return { results: allResults, supplierStatuses: statuses };
  }
}
