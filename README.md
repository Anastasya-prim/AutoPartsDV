# AutoPartsDV

Агрегатор автозапчастей Дальнего Востока: поиск по артикулу, сравнение предложений поставщиков, личный кабинет и история поиска.

---

## Структура репозитория

| Путь | Назначение |
|------|------------|
| **`src/`** | **Фронтенд** (Next.js App Router): страницы, компоненты, `src/lib/` (API-клиент, типы). |
| **`server/`** | **Бэкенд** (NestJS): REST API, Prisma, адаптеры поставщиков, почта. |
| **`deploy/`** | Конфиги **Nginx** для продакшена, инструкции по деплою и HTTPS. |
| **`e2e/`** | Сценарии **Playwright** для проверки UI. |
| **`docker-compose.yml`** | Продакшен-стек: **nginx** + **web** (Next) + **api** (Nest). |
| **`docker-compose.https.yml`** | Дополнение: порт **443** и монтирование **Let’s Encrypt**. |
| **`Dockerfile`** (корень) | Сборка образа **фронта** (Next standalone). |
| **`server/Dockerfile`** | Сборка образа **API** (Nest + Prisma + Playwright Chromium). |

Корневой **`package.json`** — зависимости и скрипты **фронта**. **`server/package.json`** — зависимости **бэкенда**.

---

## Технологии

### Фронтенд

- **Next.js** (App Router), **React**, **TypeScript**
- Стили: **Tailwind CSS**
- Сборка продакшена: режим **`output: "standalone"`** (Docker)

### Бэкенд

- **NestJS** (Node.js), **TypeScript**
- **Prisma** + **SQLite** (файл БД; в Docker — том **`sqlite_data`**)
- **JWT** (авторизация), **Passport**
- Поиск по поставщикам: адаптеры (HTTP/API и **Playwright** для сайтов со скрейпингом)
- Почта: **Nodemailer** (опционально Gmail SMTP)

### Продакшен (типичный VPS)

- **Docker Compose**: три контейнера
  - **nginx** — reverse proxy, **HTTP** (и **HTTPS** при подключении `docker-compose.https.yml`)
  - **web** — отдаёт Next.js
  - **api** — NestJS на порту 4000 внутри сети Compose
- Внешний трафик: **80** / **443** → nginx; **`/api`** проксируется на API, остальное — на фронт.

### Дополнительно в проекте

- **Яндекс.Метрика** — при заданном **`NEXT_PUBLIC_YM_ID`** при сборке фронта (см. `src/components/yandex-metrika.tsx`).
- Переменные окружения: **`server/.env`** (секреты API), опционально корневой **`.env`** для **`NEXT_PUBLIC_*`** при `docker compose build`.

Подробнее по деплою и HTTPS: **`deploy/README.md`**.

---

## Локальный запуск (разработка)

### Требования

- **Node.js** (версии как в `package.json` / LTS)
- Для бэкенда: файл **`server/.env`** (скопировать из **`server/.env.example`**, задать **`JWT_SECRET`** и при необходимости **`FRONTEND_URL`**).

### Фронтенд

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`. В dev Next проксирует **`/api`** на Nest на **`127.0.0.1:4000`** (см. `next.config.ts`).

### Бэкенд (отдельный терминал)

```bash
cd server
npm install
npm run dev
```

API по умолчанию слушает порт из **`server/.env`** (`PORT`, часто **4000**).

### Метрика локально (опционально)

В корне создайте **`.env.local`**:

```env
NEXT_PUBLIC_YM_ID=номер_счётчика
```

---

## Продакшен (Docker)

1. Скопировать **`server/.env.example` → `server/.env`**, задать секреты и **`FRONTEND_URL`** (точный URL сайта в браузере, с `https://` после включения SSL).
2. При необходимости корневой **`.env`**: **`NEXT_PUBLIC_API_URL=/api`**, **`NEXT_PUBLIC_YM_ID=...`** — затем сборка **`web`**.
3. Запуск:

```bash
docker compose build
docker compose up -d
```

С HTTPS (после выпуска сертификатов Let’s Encrypt на хосте):

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

Детали: **`deploy/README.md`**.

После пересборки контейнера **`web`** иногда нужен **`docker compose restart nginx`** (особенность резолва upstream в Docker).

---

## Поставщики и ограничения

Часть интеграций требует учётных данных в **`server/.env`**, часть сайтов блокирует автоматизацию (капча, отключённый поиск и т.д.). Краткая таблица — в истории проекта и в комментариях к адаптерам в **`server/src/parts/suppliers/`**.

| Поставщик | Замечание |
|-----------|-----------|
| **AutoTrade** | Обычно работает без логина (парсинг). |
| **Rossko**, **MX Group**, **TISS** | Нужны логины/пароли в `.env` (см. `server/.env.example`). |
| **AutoBiz** | SmartCaptcha — без API-доступа автопоиск недоступен. |
| **AM25**, **TrustAuto** | Зависят от доступности сайта/API у поставщика. |

---

## Лицензия и контакты

По вопросам развёртывания ориентируйтесь на **`deploy/README.md`** и комментарии в **`docker-compose.yml`**.
