/* ============================================================
   Типы данных для всего приложения AutoPartsDV
   ============================================================ */

export type Supplier = {
  id: string;
  name: string;
  url: string;
  region: string;
  status: "online" | "offline" | "maintenance";
  apiType: "api" | "scraper";
};

export type SearchResult = {
  id: string;
  supplier: Supplier;
  brand: string;
  article: string;
  name: string;
  price: number;
  quantity: number;
  inStock: boolean;
  deliveryDays: number;
  isAnalog: boolean;
  analogFor?: string;
};
