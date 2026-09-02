# Bloody Turkey — Deployment Checklist (Netlify + Turso)

## 1. GitHub repo

Remote should point to:

```bash
git remote set-url origin https://github.com/borek112/indykpol.git
```

Then push:

```bash
git push origin HEAD:main
```

## 2. Netlify build settings

- Base directory: `app`
- Build command: `npm install --legacy-peer-deps && npx vite build`
- Publish directory: `dist/public`
- Functions directory: `app/netlify/functions`

## 3. Netlify environment variables

Set in Netlify:

```bash
NODE_ENV=production
FRONTEND_URL=https://twoj-site.netlify.app
DEMO_MODE=true
DEMO_SEED_ON_BOOT=true
TURSO_URL=libsql://twoj-db.turso.io
TURSO_AUTH_TOKEN=<token>
JWT_SECRET=<długi-losowy-sekret>
```

Optional:

```text
VITE_API_URL=
```

`VITE_API_URL` zostaw puste, gdy API działa jako Netlify Function.

## 4. API routing

Routing jest już ustawiony w `netlify.toml`:

- `/api/*` → `/.netlify/functions/trpc/api/:splat`
- `/health` → `/.netlify/functions/trpc/health`
- `/*` → `/index.html` (SPA)

## 5. Database

Production: Turso (SQLite serverless).

MySQL (`DATABASE_URL`) jest tylko fallbackiem dla lokalnego/dev runtime.

## 6. Demo data i logowanie

- `DEMO_MODE=true` włącza `/api/demo-login`
- `/api/demo-login` automatycznie seeduje dane demo (gdy brak `demo-company-1`)
- `DEMO_SEED_ON_BOOT=false` wyłącza auto-seed

## 7. Production topology

```text
Browser
  -> Netlify frontend
  -> Netlify Functions API (tRPC)
  -> Turso (managed SQLite)
```

## 8. Local run

```bash
cd app
npm install --legacy-peer-deps
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```
