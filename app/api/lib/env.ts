import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

/*
 * Bloody Turkey Enterprise
 *
 * Kolejność:
 * 1. prawdziwe zmienne środowiskowe Railway
 * 2. lokalny .env
 * 3. .env.preview
 *
 * DATABASE_URL / MYSQL_URL nie są wymagane.
 * Połączenie z MySQL budujemy z:
 *
 * MYSQLHOST
 * MYSQLPORT
 * MYSQLUSER
 * MYSQLPASSWORD
 * MYSQLDATABASE
 */

const cwd = process.cwd();

if (fs.existsSync(path.join(cwd, ".env"))) {
  dotenv.config({
    path: path.join(cwd, ".env"),
  });
} else if (fs.existsSync(path.join(cwd, ".env.preview"))) {
  dotenv.config({
    path: path.join(cwd, ".env.preview"),
  });
}

/**
 * Zmienna opcjonalna.
 * Brak zmiennej nie zatrzymuje aplikacji.
 */
function optional(name: string, fallback = ""): string {
  const value = process.env[name];

  if (!value && process.env.NODE_ENV === "production") {
    console.warn(
      `[env] Brak zmiennej ${name} — funkcja powiązana będzie nieaktywna`,
    );
  }

  return value ?? fallback;
}

/**
 * Budowanie URL MySQL bez DATABASE_URL.
 *
 * Railway przekazuje dane MySQL osobno:
 * MYSQLHOST
 * MYSQLPORT
 * MYSQLUSER
 * MYSQLPASSWORD
 * MYSQLDATABASE
 */
function buildMysqlUrl(): string {
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || "3306";
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;

  if (!host || !user || !password || !database) {
    return "";
  }

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${database}`;
}

/**
 * Zmienne środowiskowe aplikacji.
 */
export const env = {
  /*
   * Kimi OAuth
   */
  appId: optional("APP_ID"),

  appSecret: optional(
    "APP_SECRET",
    process.env.JWT_SECRET || "bloody-turkey-dev-secret",
  ),

  /*
   * Środowisko
   */
  isProduction: process.env.NODE_ENV === "production",

  /*
   * MySQL
   *
   * DATABASE_URL nie jest wymagane.
   */
  databaseUrl: buildMysqlUrl(),

  /*
   * Kimi
   */
  kimiAuthUrl: optional("KIMI_AUTH_URL"),

  kimiOpenUrl: optional("KIMI_OPEN_URL"),

  /*
   * Właściciel / użytkownik
   */
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  /*
   * Upload plików
   */
  uploadDir:
    process.env.UPLOAD_DIR ??
    "/mnt/agents/output/uploads",

  /*
   * Bezpośrednie zmienne MySQL.
   *
   * Są również dostępne w env,
   * gdy inne moduły będą ich potrzebowały.
   */
  mysqlHost: process.env.MYSQLHOST ?? "",

  mysqlPort: process.env.MYSQLPORT ?? "3306",

  mysqlUser: process.env.MYSQLUSER ?? "",

  mysqlDatabase: process.env.MYSQLDATABASE ?? "",
};
