# Деплой: Docker Compose + Nginx

Три контейнера: **nginx** (порт 80), **web** (Next.js), **api** (NestJS). SQLite хранится в томе Docker (`sqlite_data`), путь в контейнере: `data/autoparts.db`.

## 1. Переменные

**`server/.env`** (скопируйте из `server/.env.example`):

- `JWT_SECRET` — обязательно (≥ 32 символов).
- `FRONTEND_URL` — **точный** origin сайта в браузере (без слэша в конце), например `http://ВАШ_IP` или `https://домен.ru`. Должен совпадать со схемой+хостом, с которого открывают фронт через Nginx.
- Остальное по необходимости (SMTP, поставщики).

**Корень репозитория, файл `.env`** — **обычно не нужен**: при сборке `web` по умолчанию вшивается **`NEXT_PUBLIC_API_URL=/api`** (запросы с браузера идут на тот же хост и порт, что и сайт; Nginx отдаёт их в контейнер `api`). Для **Яндекс.Метрики** задайте **`NEXT_PUBLIC_YM_ID`** (номер счётчика) и пересоберите `web`.

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

## 3. HTTPS (Let’s Encrypt + Nginx в Docker)

**Полная пошаговая инструкция** (DNS, certbot, правка `nginx.conf`, `FRONTEND_URL`, проверки, продление, откат, reg.ru): **[HTTPS-SETUP.md](./HTTPS-SETUP.md)**.

Кратко:

1. Нужен **домен** с записью **A** на IP VPS (не только IP).
2. `docker compose stop nginx` → на хосте **`certbot certonly --standalone -d домен`** → сертификаты в `/etc/letsencrypt/live/домен/`.
3. `cp deploy/nginx-https.conf deploy/nginx.conf` → заменить все **`YOUR_DOMAIN.ru`** на ваш домен (можно `sed -i 's/YOUR_DOMAIN.ru/домен/g' deploy/nginx.conf`).
4. Запуск: **`docker compose -f docker-compose.yml -f docker-compose.https.yml up -d`**.
5. В **`server/.env`**: **`FRONTEND_URL=https://ваш-домен`** (без `/` в конце), перезапуск **`api`**. При старом **`NEXT_PUBLIC_API_URL`** с `http://` — исправить и пересобрать **`web`**.

Если SSL терминирует **reg.ru/хостер** до VPS — смотрите раздел про это в **[HTTPS-SETUP.md](./HTTPS-SETUP.md)**.

## 4. Playwright (парсинг поставщиков)

Базовый образ API **не** ставит Chromium. Если в проде нужен полный парсинг, расширяйте `server/Dockerfile` (зависимости Playwright / `npx playwright install-deps`) и увеличивайте лимиты RAM на VPS.

## 5. Поиск: «Пришла HTML вместо JSON»

На сервере проверка (должен быть JSON, не `<html>`):

```bash
curl -sS http://127.0.0.1/api/suppliers | head -c 300
```

Если здесь HTML — смотрите `docker compose ps`, `docker compose logs api`, `docker compose logs nginx`. Образы: `git pull && docker compose build --no-cache && docker compose up -d`.

В браузере после обновления образа сделайте **жёсткое обновление** (Ctrl+Shift+R), чтобы не подтянулся старый JS из кэша.

`server/.env`: **`FRONTEND_URL`** должен совпадать с тем, как открываете сайт (`http://IP` без слэша в конце).

## 6. Nginx: 502 Bad Gateway на `/api/...`

Nginx до контейнера **`api`** не подключился или процесс Nest не слушает сеть.

1. **Пересоберите `api`** (важно исправление `listen(0.0.0.0)`):  
   `docker compose build --no-cache api && docker compose up -d`

2. Логи: `docker compose logs api --tail 80` — часто нет **`JWT_SECRET`**, падение **Prisma migrate**, ошибка старта.

3. Из контейнера **nginx** до **api**:  
   `docker compose exec nginx wget -qO- http://api:4000/api/health`  
   **`Connection refused`** — в контейнере **api** на 4000 никто не слушает: смотрите **`docker compose logs api`** (должны быть строки `[api] starting Nest` и `NestJS сервер запущен`). Часто не сделали **`git pull`** и **`docker compose build --no-cache api`**, или нет **`JWT_SECRET`** в `server/.env`.  
   Внутри **api**: `docker compose exec api ls -la /app/dist/src/main.js` — файл должен существовать.

4. С хоста через Nginx:  
   `curl -sS http://127.0.0.1/api/health`

5. **Минуя Nginx** (порт проброшен только на localhost VPS):  
   `curl -sS http://127.0.0.1:4000/api/health`  
   - Если здесь **JSON**, а через порт 80 — **502**, проблема была в Nginx/DNS (в репо исправлено через `resolver` + `proxy_pass` с переменной).  
   - Если и на `:4000` нет ответа — контейнер `api` не слушает или падает: `docker compose logs api`.

## 7. Сборка `api`: timeout к `deb.debian.org`

Если `apt-get` в образе API падает с **Connection timed out** к официальным зеркалам Debian, в `server/Dockerfile` уже переключены репозитории на **mirror.yandex.ru**. При необходимости замените URL на другое зеркало (хостер, `ftp.ru.debian.org` и т.д.).
