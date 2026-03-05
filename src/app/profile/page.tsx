"use client";

import Link from "next/link";

/* ============================================================
   Личный кабинет /profile
   Моковый профиль с захардкоженным пользователем.
   ============================================================ */

const mockUser = {
  name: "Иван Петров",
  email: "ivan@mail.ru",
  registeredAt: "15.03.2026",
};

const mockRecent = [
  { query: "48157-33062", date: "Сегодня, 14:30", results: 5 },
  { query: "90915-YZZD1", date: "Вчера, 09:15", results: 12 },
  { query: "04465-33471", date: "3 дня назад", results: 8 },
];

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* ── Профиль ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
            {mockUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{mockUser.name}</h1>
            <p className="text-sm text-gray-500">{mockUser.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Зарегистрирован: {mockUser.registeredAt}</p>
          </div>
        </div>
      </div>

      {/* ── Навигация ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/profile/history"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div>
            <p className="font-semibold">История поиска</p>
            <p className="text-sm text-gray-500 mt-0.5">Все ваши запросы</p>
          </div>
          <span className="text-gray-400 text-xl">→</span>
        </Link>
        <Link
          href="/login"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div>
            <p className="font-semibold">Выйти</p>
            <p className="text-sm text-gray-500 mt-0.5">Завершить сеанс</p>
          </div>
          <span className="text-gray-400 text-xl">→</span>
        </Link>
      </div>

      {/* ── Последние поиски ── */}
      <h2 className="text-lg font-semibold mb-3">Последние поиски</h2>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {mockRecent.map((item, i) => (
          <Link
            key={i}
            href={`/search?q=${item.query}`}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/50 transition-colors"
          >
            <div>
              <p className="font-mono font-medium text-sm">{item.query}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0 ml-3">
              {item.results} результатов
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
