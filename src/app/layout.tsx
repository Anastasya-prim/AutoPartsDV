import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoPartsDV — агрегатор автозапчастей Дальнего Востока",
  description: "Поиск и сравнение цен на автозапчасти у поставщиков Дальнего Востока",
};

/* ────────────────── Header ────────────────── */
function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          AutoParts<span className="text-gray-800">DV</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          Войти
        </Link>
      </div>
    </header>
  );
}

/* ────────────────── Footer ────────────────── */
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

/* ────────────────── Root Layout ────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
