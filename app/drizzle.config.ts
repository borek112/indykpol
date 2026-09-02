import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.TURSO_DB_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  ...(connectionString
    ? {
        dbCredentials: {
          url: connectionString,
          ...(authToken ? { authToken } : {}),
        },
      }
    : {}),
});
