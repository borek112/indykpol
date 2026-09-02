import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

/* Kolejność: realne zmienne środowiskowe > .env (lokalny, gitignored) > .env.preview
   (wersjonowany fallback dla kontenera preview, gdzie pipeline czyści gitignored .env). */
const cwd = process.cwd();
if (fs.existsSync(path.join(cwd, ".env"))) {
  dotenv.config({ path: path.join(cwd, ".env") });
} else if (fs.existsSync(path.join(cwd, ".env.preview"))) {
  dotenv.config({ path: path.join(cwd, ".env.preview") });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    console.warn(`[env] Brak zmiennej ${name} — funkcja powiązana będzie nieaktywna`);
  }
  return value ?? fallback;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  tursoUrl: process.env.TURSO_URL ?? process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  demoSeedOnBoot: process.env.DEMO_SEED_ON_BOOT !== "false",
  sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || (
    process.env.NODE_ENV === "production" ? required("SESSION_SECRET") : "bte-local-session-secret"
  ),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  demoMode: process.env.DEMO_MODE === "true",
  demoCompanyId: Number.parseInt(process.env.DEMO_COMPANY_ID ?? "", 10) || null,
  uploadDir: process.env.UPLOAD_DIR ?? "/mnt/agents/output/uploads",
  frontendUrl: optional("FRONTEND_URL", process.env.CORS_ORIGIN ?? ""),
};
