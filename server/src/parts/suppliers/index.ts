/**
 * Реестр всех адаптеров поставщиков.
 *
 * При добавлении нового поставщика:
 * 1. Создай файл adapters/новый.adapter.ts (наследуйся от BaseSupplierAdapter)
 * 2. Добавь экспорт сюда
 * 3. Добавь класс в массив ALL_ADAPTERS
 * 4. Зарегистрируй в supplier-aggregator.service.ts (конструктор + Map)
 */
import { RosskoAdapter } from './rossko.adapter';
import { MxGroupAdapter } from './mxgroup.adapter';
import { AutoTradeAdapter } from './autotrade.adapter';
import { TissAdapter } from './tiss.adapter';
import { AutoBizAdapter } from './autobiz.adapter';
import { Am25Adapter } from './am25.adapter';
import { TrustAutoAdapter } from './trustauto.adapter';

export {
  RosskoAdapter,
  MxGroupAdapter,
  AutoTradeAdapter,
  TissAdapter,
  AutoBizAdapter,
  Am25Adapter,
  TrustAutoAdapter,
};

export { SupplierAdapter, SupplierSearchResult, SupplierStatus } from './supplier-adapter.interface';

/** Массив всех классов адаптеров — используется в PartsModule как провайдеры */
export const ALL_ADAPTERS = [
  RosskoAdapter,
  MxGroupAdapter,
  AutoTradeAdapter,
  TissAdapter,
  AutoBizAdapter,
  Am25Adapter,
  TrustAutoAdapter,
];
