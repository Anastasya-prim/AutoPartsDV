"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Supplier } from "@/lib/types";

interface SuppliersResponse {
  suppliers: Supplier[];
}

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    let cancelled = false;

    api<SuppliersResponse>("/suppliers")
      .then((data) => { if (!cancelled) setSuppliers(data.suppliers); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Ошибка"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-80 bg-gray-200 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl shrink-0">⚠</span>
            <div>
              <p className="font-medium text-red-700">Не удалось загрузить поставщиков</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Поставщики</h1>
      <p className="text-gray-500 mb-8">
        Мы агрегируем данные от поставщиков автозапчастей Дальнего Востока
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{s.name}</h2>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  s.status === "online"
                    ? "bg-green-100 text-green-700"
                    : s.status === "maintenance"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {s.status === "online" ? "Работает" : s.status === "maintenance" ? "Обслуживание" : "Недоступен"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Регион</span>
                <span className="font-medium text-gray-800">{s.region}</span>
              </div>
              <div className="flex justify-between">
                <span>Подключение</span>
                <span className="font-medium text-gray-800">
                  {s.apiType === "api" ? "API" : "Парсинг"}
                </span>
              </div>
            </div>

            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              {s.url.replace("https://", "")} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
