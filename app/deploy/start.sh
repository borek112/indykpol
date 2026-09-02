#!/bin/sh
set -e

echo "== Bloody Turkey Enterprise — start =="

echo ">> Migracje bazy danych..."
npx tsx db/migrate-all.ts

if [ "$SEED_DEMO" = "true" ]; then
  if npx tsx db/demo-ready.ts; then
    echo ">> Dane demonstracyjne już istnieją — pomijam seed, aby zachować wpisy użytkownika."
  else
    echo ">> Ładowanie początkowych danych demonstracyjnych..."
    npx tsx db/seed.ts
    npx tsx db/seed-ingredients.ts
    npx tsx db/seed-daily.ts
    npx tsx db/seed-erp.ts
    npx tsx db/seed-gap.ts
  fi
fi

echo ">> Start serwera na porcie ${PORT:-3000}"
exec node dist/boot.js
