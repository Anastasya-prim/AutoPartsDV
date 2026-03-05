"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { searchParts, suppliers } from "@/lib/mock-data";
import type { SearchResult } from "@/lib/types";

/* ============================================================
   Страница результатов поиска /search?q=...
   Поддерживает 3 состояния: loading, error, success.
   Loading имитируется через setTimeout с поочерёдным ответом
   от каждого поставщика.
   ============================================================ */

type SortKey = "price" | "quantity" | "deliveryDays" | "supplier";

type SupplierStatus = "pending" | "loading" | "done" | "error";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [newQuery, setNewQuery] = useState(query);
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [supplierStatuses, setSupplierStatuses] = useState<Record<string, SupplierStatus>>({});

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Запуск поиска при загрузке страницы или изменении query
  useEffect(() => {
    if (!query.trim()) return;

    // Очищаем предыдущие таймеры, чтобы не было дубликатов
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setLoading(true);
    setError("");
    setResults([]);

    const initial: Record<string, SupplierStatus> = {};
    suppliers.forEach((s) => { initial[s.id] = "pending"; });
    setSupplierStatuses(initial);

    const allResults = searchParts(query);
    const activeSuppliers = suppliers.filter((s) => s.status !== "maintenance");

    activeSuppliers.forEach((supplier, i) => {
      const delay = 400 + i * 300 + Math.random() * 200;

      timersRef.current.push(
        setTimeout(() => {
          setSupplierStatuses((prev) => ({ ...prev, [supplier.id]: "loading" }));
        }, i * 250)
      );

      timersRef.current.push(
        setTimeout(() => {
          const supplierResults = allResults.filter((r) => r.supplier.id === supplier.id);
          setResults((prev) => {
            const existing = new Set(prev.map((r) => r.id));
            const unique = supplierResults.filter((r) => !existing.has(r.id));
            return [...prev, ...unique];
          });
          setSupplierStatuses((prev) => ({ ...prev, [supplier.id]: "done" }));
        }, delay)
      );
    });

    const maintenanceSuppliers = suppliers.filter((s) => s.status === "maintenance");
    maintenanceSuppliers.forEach((s) => {
      timersRef.current.push(
        setTimeout(() => {
          setSupplierStatuses((prev) => ({ ...prev, [s.id]: "error" }));
        }, 800)
      );
    });

    const totalTime = 400 + activeSuppliers.length * 300 + 300;
    timersRef.current.push(
      setTimeout(() => {
        setLoading(false);
      }, totalTime)
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [query]);

  const filtered = useMemo(() => {
    const items = onlyInStock ? results.filter((r) => r.inStock) : [...results];
    items.sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "quantity") return b.quantity - a.quantity;
      if (sortBy === "deliveryDays") return a.deliveryDays - b.deliveryDays;
      return a.supplier.name.localeCompare(b.supplier.name);
    });
    return items;
  }, [results, sortBy, onlyInStock]);

  const exact = filtered.filter((r) => !r.isAnalog);
  const analogs = filtered.filter((r) => r.isAnalog);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (newQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(newQuery.trim())}`);
    }
  }

  const doneCount = Object.values(supplierStatuses).filter((s) => s === "done").length;
  const totalCount = suppliers.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* ── Строка поиска ── */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Артикул или название"
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          {loading ? "Ищем..." : "Найти"}
        </button>
      </form>

      {/* ── Статусы поставщиков ── */}
      {query && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 text-xs">
            {suppliers.map((s) => {
              const status = supplierStatuses[s.id] || "pending";
              return (
                <span
                  key={s.id}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                    status === "done"
                      ? "bg-green-100 text-green-700"
                      : status === "loading"
                      ? "bg-blue-100 text-blue-600 animate-pulse"
                      : status === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {status === "done" && "✓ "}
                  {status === "loading" && "⏳ "}
                  {status === "error" && "✗ "}
                  {s.name}
                </span>
              );
            })}
          </div>
          {loading && (
            <div className="mt-3">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / totalCount) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Получены ответы от {doneCount} из {totalCount} поставщиков...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Заголовок и статистика ── */}
      {!loading && query && (
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            Результаты: <span className="text-blue-600">&laquo;{query}&raquo;</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Найдено {results.length} предложений — {exact.length} точных, {analogs.length} аналогов
          </p>
        </div>
      )}

      {loading && query && (
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            Ищем: <span className="text-blue-600">&laquo;{query}&raquo;</span>
          </h1>
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl shrink-0">⚠</span>
            <div>
              <p className="font-medium text-red-700">Ошибка загрузки</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={() => { setResults([]); router.push(`/search?q=${encodeURIComponent(query)}&t=${Date.now()}`); }}
                className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Повторить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading скелетоны ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-12 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="flex items-center justify-between mt-3">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-7 w-20 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Фильтры и сортировка (только когда есть результаты) ── */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded"
            />
            Только в наличии
          </label>

          <div className="flex gap-1 sm:ml-auto overflow-x-auto">
            {([
              ["price", "Цена"],
              ["quantity", "Наличие"],
              ["deliveryDays", "Срок"],
              ["supplier", "Поставщик"],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  sortBy === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Нет результатов ── */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16 sm:py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">Ничего не найдено</p>
          <p className="text-sm mt-2">
            Попробуйте артикул{" "}
            <button
              onClick={() => { setNewQuery("48157-33062"); router.push("/search?q=48157-33062"); }}
              className="text-blue-500 underline"
            >
              48157-33062
            </button>
          </p>
        </div>
      )}

      {/* ── Результаты ── */}
      {!loading && exact.length > 0 && <ResultSection title="Точные совпадения" results={exact} query={query} />}
      {!loading && analogs.length > 0 && <ResultSection title="Аналоги и заменители" results={analogs} query={query} />}
    </div>
  );
}

/* ── Секция результатов: десктоп = таблица, мобильный = карточки ── */
function ResultSection({ title, results, query }: { title: string; results: SearchResult[]; query: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">{title}</h2>

      {/* Десктоп — таблица */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_1fr_110px_80px_80px_50px] gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          <span>Поставщик</span>
          <span>Бренд</span>
          <span>Название</span>
          <span>Артикул</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Наличие</span>
          <span></span>
        </div>
        {results.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[1fr_90px_1fr_110px_80px_80px_50px] gap-2 px-4 py-3 border-t border-gray-100 items-center hover:bg-blue-50/50 transition-colors text-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${r.inStock ? "bg-green-500" : "bg-yellow-400"}`} />
              <span className="font-medium">{r.supplier.name}</span>
            </div>
            <span className="text-gray-600">{r.brand}</span>
            <Link href={`/part/${r.article}?from=${encodeURIComponent(query)}`} className="text-blue-600 hover:underline truncate">
              {r.name}
            </Link>
            <span className="text-gray-500 font-mono text-xs">{r.article}</span>
            <span className="text-right font-bold">{r.price.toLocaleString("ru-RU")}&nbsp;₽</span>
            <span className={`text-right ${r.inStock ? "text-green-600" : "text-yellow-600"}`}>
              {r.inStock ? `${r.quantity} шт` : `${r.deliveryDays} дн.`}
            </span>
            <a href={r.supplier.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-right" title="Перейти на сайт">
              ↗
            </a>
          </div>
        ))}
      </div>

      {/* Мобильный — карточки */}
      <div className="sm:hidden space-y-3">
        {results.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.inStock ? "bg-green-500" : "bg-yellow-400"}`} />
                <span className="font-medium text-sm">{r.supplier.name}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.inStock ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {r.inStock ? `${r.quantity} шт` : `${r.deliveryDays} дн.`}
              </span>
            </div>
            <Link href={`/part/${r.article}?from=${encodeURIComponent(query)}`} className="text-blue-600 hover:underline text-sm block mb-1">
              {r.name}
            </Link>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{r.brand} &middot; <span className="font-mono">{r.article}</span></span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold">{r.price.toLocaleString("ru-RU")}&nbsp;₽</span>
              <a
                href={r.supplier.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                На сайт ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
