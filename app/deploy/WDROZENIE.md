# Wdrożenie Bloody Turkey Enterprise — Netlify + Turso

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `FRONTEND_URL` | ✅ | pełny adres Netlify, np. `https://twoj-site.netlify.app` |
| `JWT_SECRET` | ✅ | długi losowy sekret sesji |
| `TURSO_URL` | ✅ | adres Turso `libsql://...` |
| `TURSO_AUTH_TOKEN` | ✅ | token dostępu Turso |
| `DEMO_MODE` | ✅ dla demo | `true` włącza `/api/demo-login` |
| `DEMO_SEED_ON_BOOT` | opcjonalnie | domyślnie `true`, seed demo przy pierwszym logowaniu demo |
| `DEMO_COMPANY_ID` | opcjonalnie | jeśli puste, używane jest `demo-company-1` lub pierwsza firma |

`VITE_API_URL` zostaw puste, jeśli API działa przez Netlify Functions.

## Netlify

1. Build:
   - Base directory: `app`
   - Build command: `npm install --legacy-peer-deps && npx vite build`
   - Publish directory: `dist/public`
2. Functions:
   - katalog: `app/netlify/functions`
3. Routing:
   - `/api/*` -> `/.netlify/functions/trpc/api/:splat`
   - `/health` -> `/.netlify/functions/trpc/health`
   - `/*` -> `/index.html`

## Baza danych

- Produkcyjnie używaj Turso.
- MySQL (`DATABASE_URL`) zostaje tylko jako fallback dla środowisk lokalnych/dev.

## Weryfikacja po wdrożeniu

```bash
curl -i https://TWOJ-SITE.netlify.app/health
curl -i https://TWOJ-SITE.netlify.app/api/trpc/ping
curl -i https://TWOJ-SITE.netlify.app/api/demo-login
```
