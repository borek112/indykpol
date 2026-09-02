import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import { shouldUseTurso } from "../lib/runtime";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

type DbInstance =
  | ReturnType<typeof drizzleMysql<typeof fullSchema>>
  | ReturnType<typeof drizzleLibsql<typeof fullSchema>>;

let instance: DbInstance;

export function getDb() {
  if (!instance) {
    if (shouldUseTurso()) {
      const client = createClient({
        url: env.tursoUrl,
        authToken: env.tursoAuthToken || undefined,
      });
      instance = drizzleLibsql(client, { schema: fullSchema });
    } else {
      if (!env.databaseUrl) throw new Error("Missing DATABASE_URL or TURSO_URL");
      instance = drizzleMysql(env.databaseUrl, {
        mode: "planetscale",
        schema: fullSchema,
      });
    }
  }
  return instance as ReturnType<typeof drizzleMysql<typeof fullSchema>>;
}
