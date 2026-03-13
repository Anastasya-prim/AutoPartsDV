/**
 * Header — шапка сайта (логотип + кнопка «Войти» / «Профиль»).
 *
 * "use client" — компонент рендерится на клиенте (в браузере), потому что
 * ему нужен доступ к localStorage и событиям window.
 *
 * Как узнаёт про вход/выход:
 * - Слушает событие "auth-change" (шлётся из setToken/removeToken в api.ts)
 * - Слушает "storage" (если токен изменился в другой вкладке браузера)
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/api";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // При первом рендере проверяем, есть ли токен
    setLoggedIn(isLoggedIn());

    // Подписываемся на изменения авторизации (из текущей и других вкладок)
    function onAuthChange() { setLoggedIn(isLoggedIn()); }
    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    // Очистка подписок при размонтировании компонента
    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          AutoParts<span className="text-gray-800">DV</span>
        </Link>
        {loggedIn ? (
          <Link
            href="/profile"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            Профиль
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
