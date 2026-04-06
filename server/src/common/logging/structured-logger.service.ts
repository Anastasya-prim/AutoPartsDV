import { Injectable } from '@nestjs/common';
import { sanitizeForLog } from './sanitize';

/**
 * Пишет одну строку JSON в stdout на событие — удобно для сбора логов в ELK/Loki.
 */
@Injectable()
export class StructuredLoggerService {
  /**
   * @param record Поля записи; вложенные объекты проходят через sanitizeForLog при type === 'business' опционально — вызывайте sanitize сами или передавайте только безопасные поля.
   */
  logRecord(record: Record<string, unknown>): void {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...record,
    });
    process.stdout.write(`${line}\n`);
  }

  /** Бизнес-событие с мягкой очисткой вложенного payload */
  logBusiness(event: string, payload: Record<string, unknown> = {}): void {
    this.logRecord({
      type: 'business',
      event,
      payload: sanitizeForLog(payload) as Record<string, unknown>,
    });
  }
}
