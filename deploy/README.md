# Деплой: Docker Compose + Nginx

Три контейнера: **nginx** (порт 80), **web** (Next.js), **api** (NestJS). SQLite хранится в томе Docker (`sqlite_data`), путь в контейнере: `data/autoparts.db`.

## 1. Переменные

**`server/.env`** (скопируйте из `server/.env.example`):

- `JWT_SECRET` — обязательно (≥ 32 символов).
- `FRONTEND_URL` — **точный** origin сайта в браузере (без слэша в конце), например `http://ВАШ_IP` или `https://домен.ru`. Должен совпадать со схемой+хостом, с которого открывают фронт через Nginx.
- Остальное по необходимости (SMTP, поставщики).

**Корень репозитория, файл `.env`** (опционально, для подстановки в сборку фронта):

- Скопируйте `deploy/env.example` → `.env` в **корне** монорепо.
- Задайте `NEXT_PUBLIC_API_URL` = тот же хост, что у пользователя, + `/api`  
  (например `http://203.0.113.10/api` или `https://домен.ru/api`).

Если корневого `.env` нет, при сборке используется значение по умолчанию `http://localhost/api` (удобно только для проверки с того же ПК).

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

## 5. Поиск: «Unexpected token '<'… is not valid JSON» / «Пришла HTML-страница»

Фронт ходит на **`NEXT_PUBLIC_API_URL` + путь** (например `/search`). Если в образе **`web`** при сборке была подставлена неверная база (часто `http://localhost/api` или забыли **`/api`**), браузер запрашивает **`http://ВАШ_IP/search`** — Nginx отдаёт **страницу Next**, не JSON.

**Исправление:** в корне репозитория файл **`.env`**:

`NEXT_PUBLIC_API_URL=http://ВАШ_IP/api` (или `https://домен/api`)

Затем пересборка только фронта:

`docker compose build --no-cache web && docker compose up -d`

## 6. Сборка `api`: timeout к `deb.debian.org`

Если `apt-get` в образе API падает с **Connection timed out** к официальным зеркалам Debian, в `server/Dockerfile` уже переключены репозитории на **mirror.yandex.ru**. При необходимости замените URL на другое зеркало (хостер, `ftp.ru.debian.org` и т.д.).
