import Link from "next/link";

/* ============================================================
   Страница «О сервисе» /about
   Скрыта от навигации — ссылок на неё пока нет.
   Доступна напрямую по URL.
   ============================================================ */

const faq = [
  { q: "Это бесплатно?", a: "Да, поиск и сравнение цен полностью бесплатны для всех пользователей." },
  { q: "Откуда берутся цены?", a: "Мы получаем данные напрямую через API поставщиков и обновляем их в реальном времени при каждом запросе." },
  { q: "Можно ли заказать через вас?", a: "Пока нет — мы перенаправляем на сайт поставщика. В будущем планируем добавить возможность заказа." },
  { q: "Как часто обновляются данные?", a: "Данные запрашиваются в реальном времени при каждом поиске. Кэш — не более 5 минут." },
  { q: "Почему некоторые поставщики недоступны?", a: "Не все поставщики предоставляют API. Часть данных получается парсингом, который менее стабилен." },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">О сервисе AutoPartsDV</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-10 leading-relaxed text-gray-700 text-sm sm:text-base">
        <p className="mb-3">
          <strong>AutoPartsDV</strong> — агрегатор автозапчастей для Дальнего Востока России.
          Вместо того чтобы заходить на каждый сайт поставщика по отдельности, вы вводите
          артикул один раз — и видите цены и наличие со всех источников в одной таблице.
        </p>
        <p className="mb-3">
          Мы работаем с поставщиками из Уссурийска, Владивостока и Хабаровска.
          Данные получаем через официальные API и парсинг сайтов.
        </p>
        <p>
          Сервис бесплатен и не требует регистрации для базового поиска.
        </p>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold mb-4">Частые вопросы</h2>
      <div className="space-y-3 mb-10">
        {faq.map((item, i) => (
          <details
            key={i}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
          >
            <summary className="px-5 py-4 cursor-pointer font-medium hover:bg-gray-50 transition-colors flex justify-between items-center text-sm sm:text-base">
              {item.q}
              <span className="text-gray-400 group-open:rotate-180 transition-transform ml-2 shrink-0">▼</span>
            </summary>
            <div className="px-5 pb-4 text-gray-600 text-sm">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold mb-4">Контакты</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">info@autopartsdv.ru</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Telegram</p>
            <p className="font-medium">@autopartsdv</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Начать поиск запчастей
        </Link>
      </div>
    </div>
  );
}
