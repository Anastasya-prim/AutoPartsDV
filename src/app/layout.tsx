/**
 * RootLayout — корневой layout приложения.
 *
 * Оборачивает ВСЕ страницы: <Header> + <main>{children}</main> + <Footer>.
 * metadata — SEO-теги (title, description) для поисковых систем.
 * Это серверный компонент (без "use client"), поэтому Header импортируется отдельно.
 */
import type { Metadata } from "next";
import "./globals.css";
import Header from "./header";
import { YandexMetrika } from "@/components/yandex-metrika";

export const metadata: Metadata = {
  title: "AutoPartsDV — агрегатор автозапчастей Дальнего Востока",
  description: "Поиск и сравнение цен на автозапчасти у поставщиков Дальнего Востока",
};

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 text-center sm:text-left">
        <p className="font-semibold text-gray-700">AutoPartsDV</p>
        <p className="mt-1">Агрегатор автозапчастей Дальнего Востока</p>
        <p className="mt-3 text-gray-400">&copy; {new Date().getFullYear()} AutoPartsDV. Все данные предоставлены поставщиками.</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <YandexMetrika />
      </body>
    </html>
  );
}
