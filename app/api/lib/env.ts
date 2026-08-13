import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const cwd = process.cwd();

if (fs.existsSync(path.join(cwd, ".env"))) {
  dotenv.config({ path: path.join(cwd, ".env") });
} else if (fs.existsSync(path.join(cwd, ".env.preview"))) {
  dotenv.config({ path: path.join(cwd, ".env.preview") });
}

function optional(name: string, fallback = ""): string {
  const value = process.env[name];

  if (!value && process.env.NODE_ENV === "production") {
    console.warn(
      `[env] Brak zmiennej ${name} — funkcja powiązana będzie nieaktywna`,
    );
  }

  return value ?? fallback;
}

/*
 * Railway MySQL:
 * MYSQLHOST
 * MYSQLPORT
 * MYSQLUSER
 * MYSQLPASSWORD
 * MYSQLDATABASE
 *
 * DATABASE_URL nie jest już wymagane.
 */

function buildMysqlUrl(): string {
  if (process.env.MYSQL_URL) {
    return process.env.MYSQL_URL;
  }

  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || "3306";
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;

  if (!host || !user || !password || !database) {
    return "";
  }

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export const env = {
  // Kimi OAuth
  appId: optional("APP_ID"),

  appSecret: optional(
    "APP_SECRET",
    process.env.JWT_SECRET || "bloody-turkey-dev-secret",
  ),

  isProduction: process.env.NODE_ENV === "production",

  // MySQL — DATABASE_URL nie jest wymagane
  databaseUrl: buildMysqlUrl(),

  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),

  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  uploadDir:
    process.env.UPLOAD_DIR ?? "/mnt/agents/output/uploads",

  // Przydatne diagnostycznie
  mysqlHost: process.env.MYSQLHOST ?? "",
  mysqlPort: process.env.MYSQLPORT ?? "3306",
  mysqlUser: process.env.MYSQLUSER ?? "",
  mysqlDatabase: process.env.MYSQLDATABASE ?? "",
};
