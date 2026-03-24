#!/bin/sh
set -e
cd /app
mkdir -p data
echo "[api] prisma migrate deploy..."
npx prisma migrate deploy
echo "[api] prisma db seed (пропуск, если БД уже заполнена)..."
npx prisma db seed
echo "[api] starting Nest (dist/src/main.js)..."
exec node dist/src/main.js
