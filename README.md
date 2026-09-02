# Bloody Turkey Enterprise

A modern poultry ERP / operations platform for turkey production management, nutrition, health, production intelligence, warehouse, and enterprise dashboards.

## Overview

This repository contains the Bloody Turkey foundation and enterprise layer including:

- operational dashboard and command center
- production and batch visibility
- feed and nutrition lab
- ERP modules and data model
- architecture and audit documents
- frontend app deployed as a static site on Netlify

## Project structure

- `app/` — frontend + API + database model
- `BTF/` — modular enterprise foundation
- `BTE_AUDIT/` — audits, architecture, comparison, risk documents
- `bloody-turkey-kimi/` — additional implementation modules

## Local development

```bash
cd app
npm install --legacy-peer-deps
npm run dev -- --host localhost --port 4173
```

Open:

```text
http://localhost:4173
```

## Production build

```bash
cd app
npm install --legacy-peer-deps
npm run build
```

## Netlify deployment

Use the app folder as the site root.

### Build settings

- Base directory: `app`
- Build command: `npm install --legacy-peer-deps && npx vite build`
- Publish directory: `dist/public`

### Environment variables (Netlify)

```bash
NODE_ENV=production
FRONTEND_URL=https://your-site.netlify.app
DEMO_MODE=true
DEMO_SEED_ON_BOOT=true
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_SECRET=your-long-secret
```

`VITE_API_URL` is optional and should stay empty when API runs as Netlify Functions.

Important:
- frontend + API run on Netlify (API through `/.netlify/functions/trpc`)
- database should be Turso (serverless SQLite) for Netlify production
- do not expose secrets in frontend variables

## Important notes

- the app is designed for a single project architecture and does not create a separate parallel system
- demo/full mode is available in the UI
- ERP create flows include a default company fallback to avoid broken inserts
- in `Struktura` you can create your own company and auto-generate starter data (farm + house + first batch)

## License

This project is provided as a working internal prototype / enterprise foundation for development purposes.
