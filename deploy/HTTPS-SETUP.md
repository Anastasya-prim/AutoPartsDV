# Подробная инструкция: HTTPS для AutoPartsDV (VPS + Docker + Nginx + Let’s Encrypt)

Этот документ описывает типичный сценарий: сайт крутится в Docker (как в `docker-compose.yml`), снаружи стоит контейнер **nginx**, вы хотите открывать сайт по **`https://ваш-домен.ru`**.

---

## Что вам понадобится

| Требование | Зачем |
|------------|--------|
| **Доменное имя** (например `autopartsdv.ru`) | Let’s Encrypt **не выдаёт** обычный бесплатный сертификат на один только IP-адрес без домена. |
| **Доступ к DNS** у регистратора (reg.ru и т.д.) | Чтобы создать запись **A** на IP вашего VPS. |
| **SSH** на VPS под пользователем с **sudo** | Установка certbot, чтение `/etc/letsencrypt`. |
| **Открытые порты 80 и 443** на VPS | Порт **80** — проверка домена и редирект на HTTPS; **443** — сам HTTPS. Проверьте файрвол хостера и `ufw` на сервере. |
| Каталог проекта на сервере | Например `/opt/autoparsdv` — дальше в командах мы будем писать `cd /путь/к/проекту`. |

---

## Этап 0. Подготовка: обновите код на сервере

```bash
cd /путь/к/AutoPartsDV
git pull
```

Убедитесь, что в репозитории есть файлы:

- `deploy/nginx-https.conf`
- `docker-compose.https.yml`

---

## Этап 1. Настройка DNS

### 1.1. Узнайте публичный IP сервера

На VPS:

```bash
curl -sS ifconfig.me
# или
curl -sS icanhazip.com
```

Запомните IPv4 (например `89.104.68.243`).

### 1.2. Создайте записи у регистратора домена

В панели reg.ru (или у другого регистратора) откройте DNS для домена и добавьте:

| Тип | Имя / поддомен | Значение | TTL |
|-----|----------------|----------|-----|
| **A** | `@` (или пусто — корень домена) | IP вашего VPS | 300–3600 |
| **A** | `www` | тот же IP | по желанию |

Пример: для домена `example.ru` в браузере откроются и `example.ru`, и `www.example.ru`, если обе записи указывают на VPS.

### 1.3. Дождитесь распространения DNS

Обычно от **нескольких минут до 24–48 часов**. Проверка с вашего ПК или с VPS:

```bash
dig +short example.ru A
dig +short www.example.ru A
```

Оба должны вернуть **тот же IP**, что у сервера. Пока `dig` не показывает правильный IP, **certbot чаще всего не сможет** выпустить сертификат.

---

## Этап 2. Порты и конфликт на порту 80

**Let’s Encrypt** в режиме **`certonly --standalone`** поднимает на сервере **временный** веб-сервер на порту **80**. Поэтому в этот момент **ничто другое** не должно занимать порт 80.

У вас порт 80 занят контейнером **nginx** из Docker. Его нужно **остановить** перед certbot.

Проверка, кто слушает 80 (на хосте):

```bash
sudo ss -tlnp | grep ':80 '
```

Если видите `docker-proxy` — это как раз ваш compose.

---

## Этап 3. Установка Certbot и выпуск сертификата

Все команды — **на хосте VPS**, не внутри контейнера.

### 3.1. Остановите только Nginx в Compose

Перейдите в каталог с `docker-compose.yml`:

```bash
cd /путь/к/AutoPartsDV
docker compose stop nginx
```

Остальные сервисы (`web`, `api`) можно **не** останавливать — они не используют порт 80 на хосте.

### 3.2. Установите Certbot (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y certbot
```

### 3.3. Запустите выпуск сертификата

Замените `example.ru` на **ваш** домен.

**Вариант A — домен с `www` (как в шаблоне `nginx-https.conf`):**

```bash
sudo certbot certonly --standalone \
  -d example.ru \
  -d www.example.ru \
  --email ваш@email.ru \
  --agree-tos \
  --non-interactive
```

**Вариант B — только корень, без www:**

```bash
sudo certbot certonly --standalone \
  -d example.ru \
  --email ваш@email.ru \
  --agree-tos \
  --non-interactive
```

Certbot спросит согласие с условиями (если запускаете **без** `--non-interactive`, ответьте вручную). После успеха появится сообщение о пути к сертификату.

### 3.4. Где лежат файлы

Обычно:

```text
/etc/letsencrypt/live/example.ru/fullchain.pem
/etc/letsencrypt/live/example.ru/privkey.pem
```

Имя каталога **`live/ИМЯ_ДОМЕНА`** совпадает с **первым** `-d` в команде certbot (основное имя сертификата).

### 3.5. Если certbot выдал ошибку

| Симптом | Что проверить |
|---------|----------------|
| `Connection refused` / timeout при проверке | DNS ещё не указывает на этот сервер; с хостера блокируют порт 80 снаружи. |
| `Address already in use` на 80 | Не остановили `docker compose stop nginx` или другой процесс слушает 80. |
| `Too many certificates` | Лимит повторных выпусков для того же набора имён — подождите или используйте [staging](https://letsencrypt.org/docs/staging-environment/) для тестов. |

### 3.6. Снова поднимите Nginx (пока ещё со старым HTTP-конфигом)

```bash
cd /путь/к/AutoPartsDV
docker compose start nginx
```

Или, если привыкли:

```bash
docker compose up -d
```

На этом этапе сайт по-прежнему открывается по **http://** — это нормально, HTTPS мы включим дальше.

---

## Этап 4. Конфигурация Nginx для HTTPS

Не используйте **`cp … deploy/nginx.conf`** — этот путь конфликтует с **`git pull`**. Вместо этого в **корне репозитория** создайте **`.env`** (файл в `.gitignore`) со строкой, указывающей на конфиг с **`listen 443`**:

```bash
cd /путь/к/AutoPartsDV
echo 'NGINX_CONF=./deploy/nginx.autopartsdv.space.conf' >> .env
```

Если домен **не** `autopartsdv.space` / `www.autopartsdv.space`, подготовьте свой файл:

### 4.1. Шаблон и домен

```bash
cp deploy/nginx-https.conf deploy/nginx.mydomain.conf
sed -i 's/YOUR_DOMAIN.ru/example.ru/g' deploy/nginx.mydomain.conf
```

В **`deploy/nginx.mydomain.conf`** проверьте пути к сертификатам (`ssl_certificate` → `/etc/letsencrypt/live/...`).

В **`.env`** в корне:

```bash
NGINX_CONF=./deploy/nginx.mydomain.conf
```

Проверьте:

```bash
grep -n "example.ru" deploy/nginx.mydomain.conf
grep -n "letsencrypt" deploy/nginx.mydomain.conf
```

**Если сертификат вы выпускали только на `example.ru` без `www`:**

- В `server_name` и в редиректе с HTTP уберите `www.example.ru`, оставьте только `example.ru`, **или** выпустите сертификат заново с `-d example.ru -d www.example.ru`.

### 4.2. Проверка синтаксиса Nginx (опционально)

```bash
docker compose run --rm --no-deps nginx nginx -t
```

Если образ ещё не скачан, сначала `docker compose pull nginx`. Команда может ругаться на отсутствие файлов сертификата **внутри** контейнера, если вы не смонтировали `/etc/letsencrypt` — полную проверку проще сделать после следующего шага, открыв сайт.

---

## Этап 5. Запуск Docker Compose с HTTPS

Нужно одновременно:

- основной файл **`docker-compose.yml`**;
- дополнение **`docker-compose.https.yml`** (порт **443** + том с сертификатами).

```bash
cd /путь/к/AutoPartsDV
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

Проверка контейнеров:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml ps
```

Должны быть **Up** сервисы `nginx`, `web`, `api`.

---

## Этап 6. Настройка приложения (CORS и фронт)

### 6.1. `FRONTEND_URL` в `server/.env`

Бэкенд (NestJS) разрешает CORS только с origin из **`FRONTEND_URL`**.

Откройте **`server/.env`** на сервере и задайте **ровно** тот URL, который пользователь вводит в браузере:

```env
FRONTEND_URL=https://example.ru
```

Без слэша в конце. Если заходят только с `https://www.example.ru`, укажите его (или настройте редирект так, чтобы «канонический» адрес был один — как в `nginx-https.conf` редирект идёт на `https://YOUR_DOMAIN.ru` без www).

После правки перезапустите API:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml restart api
```

### 6.2. `NEXT_PUBLIC_API_URL` и образ `web`

Если в **корневом** `.env` при сборке вы **не** задавали полный URL (по умолчанию в compose — **`/api`**), браузер сам ходит на `https://ваш-домен/api` — **пересборка `web` не нужна**.

Если вы раньше зашили **`NEXT_PUBLIC_API_URL=http://...`**, замените на **`https://...`** (или верните `/api`) и пересоберите:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml build --no-cache web
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

---

## Этап 7. Проверка, что всё работает

С VPS:

```bash
curl -sSI https://example.ru/ | head -5
curl -sS https://example.ru/api/health
```

Ожидается ответ **200** и JSON вроде `{"ok":true}` для health.

В браузере:

1. Откройте `https://example.ru`.
2. `http://example.ru` должен **перенаправить** на `https://...`.
3. В адресной строке должен быть **замочек** (валидный сертификат).

---

## Этап 8. Продление сертификата Let’s Encrypt

Сертификаты действуют **~90 дней**. Certbot обычно ставит **systemd timer** или **cron** для `certbot renew`.

Важно: при методе **standalone** renew тоже нужен **свободный порт 80** на момент продления. Практичный вариант — **deploy-hook**, который на секунду останавливает nginx-контейнер, обновляет сертификат и снова поднимает nginx. Пример (подставьте свой путь и те же `-f`, что используете):

```bash
sudo certbot renew --deploy-hook 'cd /путь/к/AutoPartsDV && docker compose -f docker-compose.yml -f docker-compose.https.yml restart nginx'
```

Точную настройку смотрите в выводе `sudo certbot renew --dry-run` и документации Certbot для вашей ОС.

Альтернатива для продвинутых — плагин **webroot** или **DNS-01**, чтобы не останавливать Nginx; это отдельная настройка.

---

## SSL у reg.ru / хостера «перед» вашим VPS

Иногда трафик идёт так: **пользователь → HTTPS на стороне reg.ru → HTTP на ваш VPS**. Тогда:

- на **вашем** Nginx может остаться только **порт 80**;
- Let’s Encrypt на VPS **может не понадобиться**;
- в **`FRONTEND_URL`** всё равно укажите **публичный** `https://...`, как видит пользователь.

Схему уточняйте в поддержке reg.ru: терминируется ли SSL у них и что тогда писать в `FRONTEND_URL`.

---

## Откат на HTTP

1. В корневом **`.env`** удалите строку **`NGINX_CONF=...`** (или закомментируйте) — подставится **`deploy/nginx.http.conf`** (только порт 80).
2. Запускайте без второго файла: `docker compose up -d`.
3. В **`server/.env`** снова `FRONTEND_URL=http://...`.
4. Перезапустите `api`.

---

## Краткий чеклист

- [ ] DNS **A** на IP VPS проверен (`dig`).
- [ ] Порты **80** и **443** открыты.
- [ ] `docker compose stop nginx` → certbot `--standalone` → сертификат в `/etc/letsencrypt/live/домен/`.
- [ ] В корневом **`.env`**: **`NGINX_CONF=./deploy/...conf`** (HTTPS), либо готовый **`nginx.autopartsdv.space.conf`** для этого домена.
- [ ] `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d`.
- [ ] `FRONTEND_URL=https://...` в `server/.env`, перезапуск `api`.
- [ ] При необходимости исправлен `NEXT_PUBLIC_API_URL` и пересобран `web`.
- [ ] Проверены `curl` и браузер.

Более короткая версия этих шагов — в [README.md](./README.md), раздел «HTTPS».
