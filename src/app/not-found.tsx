import Link from "next/link";

/* ============================================================
   Кастомная 404 страница.
   Показывается при переходе на несуществующий URL.
   ============================================================ */

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl sm:text-8xl font-extrabold text-gray-200">404</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-4">Страница не найдена</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Возможно, она была удалена или вы ввели неверный адрес
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Вернуться к поиску
        </Link>
      </div>
    </div>
  );
}
