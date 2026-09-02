import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const tursoUrl = process.env.TURSO_URL ?? process.env.TURSO_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: tursoUrl ? "turso" : "mysql",
  ...(tursoUrl
    ? {
        dbCredentials: {
          url: tursoUrl,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : databaseUrl
    ? {
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {}),
});
