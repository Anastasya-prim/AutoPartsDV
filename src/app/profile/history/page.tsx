"use client";

import Link from "next/link";

/* ============================================================
   История поиска /profile/history
   Моковые данные — поиски сгруппированы по дням.
   ============================================================ */

const mockHistory = [
  {
    day: "Сегодня",
    items: [
      { time: "14:30", query: "48157-33062", results: 5 },
      { time: "12:15", query: "колодки camry", results: 18 },
      { time: "09:40", query: "90915-YZZD1", results: 12 },
    ],
  },
  {
    day: "Вчера",
    items: [
      { time: "17:20", query: "04465-33471", results: 8 },
      { time: "11:05", query: "43330-09510", results: 6 },
    ],
  },
  {
    day: "3 марта",
    items: [
      { time: "16:10", query: "16400-31090", results: 14 },
      { time: "10:30", query: "масляный фильтр corolla", results: 22 },
    ],
  },
];

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* ── Навигация ── */}
      <Link href="/profile" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Профиль
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">История поиска</h1>
        <button className="text-sm text-red-500 hover:text-red-600 transition-colors">
          Очистить
        </button>
      </div>

      {/* ── Фильтр по периоду ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {["Сегодня", "Неделя", "Месяц", "Всё время"].map((period, i) => (
          <button
            key={period}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              i === 3
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* ── Список по дням ── */}
      <div className="space-y-6">
        {mockHistory.map((group) => (
          <div key={group.day}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {group.day}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {group.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-400 w-10 shrink-0">{item.time}</span>
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-sm truncate">{item.query}</p>
                      <p className="text-xs text-gray-400">{item.results} результатов</p>
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
    </div>
  );
}
