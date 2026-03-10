"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, removeToken, isLoggedIn, getUserRole } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  registeredAt: string;
}

interface HistoryItem {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [profileData, historyData] = await Promise.all([
          api<User>("/profile", { auth: true }),
          api<{ history: HistoryItem[] }>("/history", { auth: true }),
        ]);
        if (cancelled) return;
        setUser(profileData);
        setRecent(historyData.history.slice(0, 5));
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Ошибка загрузки";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("токен")) {
          removeToken();
          setRedirecting(true);
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  async function handleChangePassword() {
    setPwError("");
    setPwSuccess("");

    if (!currentPassword) { setPwError("Введите текущий пароль"); return; }
    if (newPassword.length < 6) { setPwError("Новый пароль — минимум 6 символов"); return; }
    if (newPassword !== confirmPassword) { setPwError("Пароли не совпадают"); return; }

    setPwLoading(true);
    try {
      await api<{ message: string }>("/auth/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
        auth: true,
      });
      setPwSuccess("Пароль успешно изменён");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordForm(false), 1500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Ошибка смены пароля");
    } finally {
      setPwLoading(false);
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
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-20" />
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl shrink-0">⚠</span>
            <div>
              <p className="font-medium text-red-700">Ошибка загрузки профиля</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={() => { removeToken(); router.push("/login"); }}
                className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Войти заново
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatRelative(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Только что";
    if (diffMin < 60) return `${diffMin} мин. назад`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ч. назад`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Вчера";
    return `${diffD} дн. назад`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* ── Профиль ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Зарегистрирован: {formatDate(user.registeredAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Админ-панель (только для admin) ── */}
      {getUserRole() === "admin" && (
        <Link
          href="/admin/suppliers"
          className="block bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 hover:border-orange-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-orange-800">Управление поставщиками</p>
              <p className="text-sm text-orange-600 mt-0.5">Добавление, редактирование, удаление</p>
            </div>
            <span className="text-orange-400 text-xl">→</span>
          </div>
        </Link>
      )}

      {/* ── Навигация ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        <button
          onClick={() => { setShowPasswordForm(!showPasswordForm); setPwError(""); setPwSuccess(""); }}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between text-left w-full"
        >
          <div>
            <p className="font-semibold">Сменить пароль</p>
            <p className="text-sm text-gray-500 mt-0.5">Безопасность</p>
          </div>
          <span className="text-gray-400 text-xl">{showPasswordForm ? "↑" : "→"}</span>
        </button>
        <button
          onClick={handleLogout}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-sm transition-all flex items-center justify-between text-left w-full"
        >
          <div>
            <p className="font-semibold">Выйти</p>
            <p className="text-sm text-gray-500 mt-0.5">Завершить сеанс</p>
          </div>
          <span className="text-gray-400 text-xl">→</span>
        </button>
      </div>

      {/* ── Смена пароля ── */}
      {showPasswordForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Смена пароля</h2>

          {pwSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
              {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {pwError}
            </div>
          )}

          <div className="space-y-3 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите текущий пароль"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Минимум 6 символов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите новый пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Повторите новый пароль"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {pwLoading ? "Сохранение..." : "Сменить пароль"}
            </button>
          </div>
        </div>
      )}

      {/* ── Последние поиски ── */}
      <h2 className="text-lg font-semibold mb-3">Последние поиски</h2>
      {recent.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {recent.map((item) => (
            <Link
              key={item.id}
              href={`/search?q=${encodeURIComponent(item.query)}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/50 transition-colors"
            >
              <div>
                <p className="font-mono font-medium text-sm">{item.query}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.createdAt)}</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0 ml-3">
                {item.resultsCount} результатов
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <p>Пока нет поисковых запросов</p>
          <Link href="/" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
            Попробовать поиск
          </Link>
        </div>
      )}
    </div>
  );
}
