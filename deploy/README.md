# Деплой: Docker Compose + Nginx

Три контейнера: **nginx** (порт 80), **web** (Next.js), **api** (NestJS). SQLite хранится в томе Docker (`sqlite_data`), путь в контейнере: `data/autoparts.db`.

## 1. Переменные

**`server/.env`** (скопируйте из `server/.env.example`):

- `JWT_SECRET` — обязательно (≥ 32 символов).
- `FRONTEND_URL` — **точный** origin сайта в браузере (без слэша в конце), например `http://ВАШ_IP` или `https://домен.ru`. Должен совпадать со схемой+хостом, с которого открывают фронт через Nginx.
- Остальное по необходимости (SMTP, поставщики).

**Корень репозитория, файл `.env`** — **обычно не нужен**: при сборке `web` по умолчанию вшивается **`NEXT_PUBLIC_API_URL=/api`** (запросы с браузера идут на тот же хост и порт, что и сайт; Nginx отдаёт их в контейнер `api`).

Если API на **другом** домене — создайте `.env` в корне и задайте полный URL с `/api`, затем пересоберите `web`.

После смены `NEXT_PUBLIC_API_URL` пересоберите образ **`web`**:  
`docker compose build --no-cache web && docker compose up -d`.

## 2. Запуск

```bash
docker compose build
docker compose up -d
docker compose logs -f api
```

Сайт: `http://ВАШ_IP` (или домен, если DNS указывает на VPS).

## 3. HTTPS (Let’s Encrypt)

На хосте установите certbot и настройте отдельный `server` в Nginx на 443 или вынесите TLS на внешний балансировщик. После включения HTTPS обновите `FRONTEND_URL` и `NEXT_PUBLIC_API_URL` на `https://...` и пересоберите `web`.

## 4. Playwright (парсинг поставщиков)

Базовый образ API **не** ставит Chromium. Если в проде нужен полный парсинг, расширяйте `server/Dockerfile` (зависимости Playwright / `npx playwright install-deps`) и увеличивайте лимиты RAM на VPS.

## 5. Поиск: «Пришла HTML-страница вместо JSON»

Чаще всего запрос ушёл **не** в Nest (например старый образ с `http://localhost/api` — с ПК пользователя «localhost» это не ваш VPS). В актуальном репо по умолчанию **`/api`** на том же хосте.

**Исправление:** `git pull`, затем `docker compose build --no-cache web && docker compose up -d`. Проверьте `server/.env`: **`FRONTEND_URL`** = как открываете сайт (`http://IP` или `https://домен`).

## 6. Сборка `api`: timeout к `deb.debian.org`

Если `apt-get` в образе API падает с **Connection timed out** к официальным зеркалам Debian, в `server/Dockerfile` уже переключены репозитории на **mirror.yandex.ru**. При необходимости замените URL на другое зеркало (хостер, `ftp.ru.debian.org` и т.д.).
