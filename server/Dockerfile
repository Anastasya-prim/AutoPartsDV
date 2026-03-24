# API NestJS + Prisma (SQLite)
FROM node:22-bookworm-slim

# С deb.debian.org из части сетей (в т.ч. РФ) часто timeout на apt.
# Зеркало Яндекса обычно стабильнее; при необходимости замените на своё.
RUN rm -f /etc/apt/sources.list.d/debian.sources \
  && printf '%s\n' \
    "deb http://mirror.yandex.ru/debian/ bookworm main" \
    "deb http://mirror.yandex.ru/debian/ bookworm-updates main" \
    "deb http://mirror.yandex.ru/debian-security bookworm-security main" \
    > /etc/apt/sources.list

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY nest-cli.json tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "mkdir -p data && npx prisma migrate deploy && node dist/src/main.js"]
