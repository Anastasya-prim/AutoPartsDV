"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { mockResults } from "@/lib/mock-data";

/* ============================================================
   Карточка запчасти /part/[article]
   Все предложения по артикулу + аналоги.
   Адаптивная: карточки на мобильных.
   ============================================================ */

export default function PartPage() {
  const { article } = useParams<{ article: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(article);

  // Определяем, к какому поисковому запросу вернуться
  const fromQuery = searchParams.get("from") || decoded;

  const offers = useMemo(
    () => mockResults.filter((r) => r.article === decoded),
    [decoded]
  );

  const analogs = useMemo(() => {
    const originalArticle = offers[0]?.isAnalog ? offers[0].analogFor : decoded;
    return mockResults.filter(
      (r) => r.isAnalog && r.analogFor === originalArticle && r.article !== decoded
    );
  }, [decoded, offers]);

  const bestPrice = offers.length
    ? Math.min(...offers.map((r) => r.price))
    : null;

  const partName = offers[0]?.name || "Запчасть";
  const partBrand = offers[0]?.brand || "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* ── Навигация ── */}
      <Link
        href={`/search?q=${encodeURIComponent(fromQuery)}`}
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Назад к &laquo;{fromQuery}&raquo;
      </Link>

      {/* ── Заголовок ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{partBrand}</p>
            <h1 className="text-xl sm:text-2xl font-bold">{decoded}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{partName}</p>
          </div>
          {bestPrice && (
            <div className="sm:text-right">
              <p className="text-sm text-gray-500">Лучшая цена</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-green-600">{bestPrice.toLocaleString("ru-RU")}&nbsp;₽</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Предложения ── */}
      {offers.length > 0 ? (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold mb-3">Предложения ({offers.length})</h2>
          <div className="space-y-3 sm:space-y-0">
            {/* Десктоп — список */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {offers
                .sort((a, b) => a.price - b.price)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.inStock ? "bg-green-500" : "bg-yellow-400"}`} />
                      <div>
                        <p className="font-medium">{r.supplier.name}</p>
                        <p className="text-xs text-gray-400">{r.supplier.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className={r.inStock ? "text-green-600" : "text-yellow-600"}>
                        {r.inStock ? `${r.quantity} шт` : `под заказ (${r.deliveryDays} дн.)`}
                      </span>
                      <span className="font-bold text-lg">{r.price.toLocaleString("ru-RU")}&nbsp;₽</span>
                      <a href={r.supplier.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        На сайт ↗
                      </a>
                    </div>
                  </div>
                ))}
            </div>

            {/* Мобильный — карточки */}
            <div className="sm:hidden space-y-3">
              {offers
                .sort((a, b) => a.price - b.price)
                .map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.inStock ? "bg-green-500" : "bg-yellow-400"}`} />
                        <div>
                          <p className="font-medium text-sm">{r.supplier.name}</p>
                          <p className="text-xs text-gray-400">{r.supplier.region}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.inStock ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {r.inStock ? `${r.quantity} шт` : `${r.deliveryDays} дн.`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold">{r.price.toLocaleString("ru-RU")}&nbsp;₽</span>
                      <a href={r.supplier.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        На сайт ↗
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>По артикулу <span className="font-mono">{decoded}</span> нет данных</p>
          <Link href="/" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
            Попробовать другой поиск
          </Link>
        </div>
      )}

      {/* ── Аналоги ── */}
      {analogs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Аналоги и заменители</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {analogs.map((r) => (
              <Link
                key={r.id}
                href={`/part/${encodeURIComponent(r.article)}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <p className="text-xs text-gray-400">{r.brand}</p>
                <p className="font-semibold font-mono">{r.article}</p>
                <p className="text-sm text-gray-600 mt-1">{r.name}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-green-600 font-bold">{r.price.toLocaleString("ru-RU")}&nbsp;₽</span>
                  <span className="text-xs text-gray-400">{r.supplier.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
