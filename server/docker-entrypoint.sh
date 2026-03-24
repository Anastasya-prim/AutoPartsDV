#!/bin/sh
set -e
cd /app
mkdir -p data
echo "[api] prisma migrate deploy..."
npx prisma migrate deploy
echo "[api] starting Nest (dist/src/main.js)..."
exec node dist/src/main.js
