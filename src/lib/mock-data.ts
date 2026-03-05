/* ============================================================
   Моковые (захардкоженные) данные — заменятся на API позже.
   Содержат список поставщиков и примеры результатов поиска.
   ============================================================ */

import { Supplier, SearchResult } from "./types";

export const suppliers: Supplier[] = [
  { id: "rossko",    name: "Rossko",     url: "https://ussuri.rossko.ru",  region: "Уссурийск", status: "online",  apiType: "api" },
  { id: "mxgroup",   name: "MX Group",   url: "https://mxgroup.ru",       region: "Владивосток", status: "online",  apiType: "api" },
  { id: "autotrade", name: "AutoTrade",  url: "https://autotrade.su",     region: "Уссурийск", status: "online",  apiType: "api" },
  { id: "tiss",      name: "TISS",       url: "https://my.tiss.ru",       region: "Владивосток", status: "online",  apiType: "api" },
  { id: "autobiz",   name: "AutoBiz",    url: "https://autobiz.ru",       region: "Владивосток", status: "online",  apiType: "api" },
  { id: "am25",      name: "AM25",       url: "https://am25.ru",          region: "Владивосток", status: "maintenance", apiType: "scraper" },
  { id: "trustauto", name: "TrustAuto",  url: "https://trustautovl.ru",   region: "Владивосток", status: "online",  apiType: "scraper" },
];

// Артикулы, по которым есть моковые результаты
export const popularQueries = [
  "48157-33062",
  "90915-YZZD1",
  "04465-33471",
  "43330-09510",
  "16400-31090",
];

export const mockResults: SearchResult[] = [
  // --- Точные совпадения по артикулу 48157-33062 ---
  { id: "1",  supplier: suppliers[0], brand: "TOYOTA",  article: "48157-33062", name: "Опора амортизатора передняя левая",   price: 1350,  quantity: 5,   inStock: true,  deliveryDays: 0, isAnalog: false },
  { id: "2",  supplier: suppliers[1], brand: "TOYOTA",  article: "48157-33062", name: "Опора амортизатора передняя левая",   price: 1280,  quantity: 12,  inStock: true,  deliveryDays: 0, isAnalog: false },
  { id: "3",  supplier: suppliers[2], brand: "TOYOTA",  article: "48157-33062", name: "Опора амортизатора передняя левая",   price: 1420,  quantity: 2,   inStock: true,  deliveryDays: 1, isAnalog: false },
  { id: "4",  supplier: suppliers[3], brand: "TOYOTA",  article: "48157-33062", name: "Опора стойки передняя левая",         price: 1500,  quantity: 0,   inStock: false, deliveryDays: 3, isAnalog: false },
  { id: "5",  supplier: suppliers[4], brand: "TOYOTA",  article: "48157-33062", name: "Опора амортизатора передняя левая",   price: 1310,  quantity: 8,   inStock: true,  deliveryDays: 0, isAnalog: false },

  // --- Аналоги ---
  { id: "6",  supplier: suppliers[1], brand: "FEBEST",  article: "TSB-ACR50F",  name: "Опора амортизатора передняя",        price: 640,   quantity: 25,  inStock: true,  deliveryDays: 0, isAnalog: true, analogFor: "48157-33062" },
  { id: "7",  supplier: suppliers[0], brand: "CTR",     article: "CVKH-109",    name: "Опора стойки передняя",              price: 580,   quantity: 8,   inStock: true,  deliveryDays: 0, isAnalog: true, analogFor: "48157-33062" },
  { id: "8",  supplier: suppliers[2], brand: "MASUMA",  article: "SAM-1102",    name: "Опора амортизатора",                 price: 720,   quantity: 4,   inStock: true,  deliveryDays: 1, isAnalog: true, analogFor: "48157-33062" },
  { id: "9",  supplier: suppliers[6], brand: "SAT",     article: "ST-48157-33062", name: "Опора амортизатора передняя лев.", price: 490,   quantity: 15,  inStock: true,  deliveryDays: 0, isAnalog: true, analogFor: "48157-33062" },
  { id: "10", supplier: suppliers[3], brand: "JIKIU",   article: "JM-12015",    name: "Опора передней стойки",              price: 850,   quantity: 0,   inStock: false, deliveryDays: 5, isAnalog: true, analogFor: "48157-33062" },
];

/** Имитация поиска — фильтрует моковые данные по запросу */
export function searchParts(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return mockResults.filter(
    (r) =>
      r.article.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q)
  );
}
