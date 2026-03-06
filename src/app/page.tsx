"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const popularQueries = ["48157-33062", "90915-YZZD1", "04465-33471"];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <>
      <section className="bg-white py-16 sm:py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-3">
            Найди запчасть по лучшей цене
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-8">
            Сравниваем цены и наличие у поставщиков Дальнего Востока
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Артикул или название запчасти"
              className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-lg shrink-0"
            >
              Найти
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-gray-400">Примеры:</span>
            {popularQueries.map((q) => (
              <button
                key={q}
                onClick={() => router.push(`/search?q=${q}`)}
                className="bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10">Как это работает</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
          {[
            { step: "1", title: "Введите артикул", desc: "Укажите OEM-номер, артикул или название запчасти" },
            { step: "2", title: "Сравните цены", desc: "Мы покажем предложения от всех поставщиков в одной таблице" },
            { step: "3", title: "Выберите лучшее", desc: "Перейдите на сайт поставщика и оформите заказ" },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
