/**
 * Показывается при переходе на /search (например с главной), пока подгружается сегмент маршрута.
 */
export default function SearchRouteLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
        <div className="w-24 h-11 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <p className="text-sm text-gray-500 mb-4" role="status">
        Загрузка поиска…
      </p>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
