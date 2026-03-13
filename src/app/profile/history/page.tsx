/**
 * Страница истории поиска — /profile/history
 *
 * Показывает все поисковые запросы пользователя, сгруппированные по дням
 * (Сегодня / Вчера / 12 марта). Можно очистить всю историю или повторить запрос.
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, isLoggedIn, removeToken } from "@/lib/api";

interface HistoryItem {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

/** Группа записей за один день (для отображения заголовков «Сегодня», «Вчера»...) */
interface DayGroup {
  day: string;
  items: HistoryItem[];
}

/** Группирует записи истории по дням (Сегодня / Вчера / дата) */
function groupByDay(items: HistoryItem[]): DayGroup[] {
  const groups: Record<string, HistoryItem[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const item of items) {
    const d = new Date(item.createdAt);
    const ds = d.toDateString();
    let label: string;
    if (ds === today) label = "Сегодня";
    else if (ds === yesterday) label = "Вчера";
    else label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return Object.entries(groups).map(([day, items]) => ({ day, items }));
}

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [clearing, setClearing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    let cancelled = false;
    api<{ history: HistoryItem[] }>("/history", { auth: true })
      .then((data) => { if (!cancelled) setHistory(data.history); })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Ошибка";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("токен")) {
          removeToken();
          setRedirecting(true);
          router.replace("/login");
          return;
        }
        setError(msg);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [router]);

  const grouped = useMemo(() => groupByDay(history), [history]);

  async function handleClear() {
    setClearing(true);
    try {
      await api("/history", { method: "DELETE", auth: true });
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка очистки");
    } finally {
      setClearing(false);
    }
  }

  if (redirecting) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 text-center text-gray-500">
        Перенаправление на страницу входа...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <div className="h-4 w-20 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <Link href="/profile" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Профиль</Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-medium text-red-700">Ошибка</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <Link href="/profile" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Профиль
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">История поиска</h1>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-sm text-red-500 hover:text-red-600 disabled:text-red-300 transition-colors"
          >
            {clearing ? "Очистка..." : "Очистить"}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p>История пуста</p>
          <Link href="/" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
            Попробовать поиск
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.day}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {group.day}
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-400 w-10 shrink-0">{formatTime(item.createdAt)}</span>
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-sm truncate">{item.query}</p>
                        <p className="text-xs text-gray-400">{item.resultsCount} результатов</p>
                      </div>
                    </div>
                    <Link
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium shrink-0 ml-3"
                    >
                      Повторить
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
