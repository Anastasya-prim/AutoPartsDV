/**
 * Интерфейсы для работы с поставщиками.
 * Все адаптеры и агрегатор используют эти типы.
 */

/** Одна запчасть, полученная от поставщика */
export interface SupplierSearchResult {
  brand: string;          // Бренд (Toyota, Bosch и т.д.)
  article: string;        // Артикул / OEM-номер
  name: string;           // Название запчасти
  price: number;          // Цена в рублях
  quantity: number;        // Количество на складе
  inStock: boolean;        // true = есть в наличии, false = под заказ
  deliveryDays: number;    // Срок доставки (дней), 0 если в наличии
  isAnalog: boolean;       // true = аналог / заменитель (не оригинал)
  analogFor?: string;      // Артикул оригинала (если это аналог)
}

/** Статус ответа одного поставщика после запроса */
export interface SupplierStatus {
  supplierId: string;                      // ID поставщика
  status: 'ok' | 'error' | 'skipped';     // ok = ответил, error = упал, skipped = пропущен
  responseTimeMs: number;                  // Время ответа в мс
  resultsCount: number;                    // Сколько результатов вернул
  error?: string;                          // Текст ошибки (если status = error/skipped)
}

/** Контракт, который должен реализовать каждый адаптер поставщика */
export interface SupplierAdapter {
  readonly supplierId: string;

  /** Ищет запчасти по артикулу на сайте поставщика */
  search(article: string): Promise<SupplierSearchResult[]>;
}
