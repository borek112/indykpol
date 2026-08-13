/**
 * Zastosuj wszystkie migracje SQL z db/migrations.
 * Diagnostyka DATABASE_URL bez ujawniania hasła.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== DATABASE DIAGNOSTICS ===");
  console.log("cwd:", process.cwd());
  console.log("NODE_ENV:", process.env.NODE_ENV ?? "(brak)");

  const databaseUrl = process.env.DATABASE_URL;
  const mysqlUrl = process.env.MYSQL_URL;

  console.log(
    "DATABASE_URL:",
    databaseUrl ? `PRESENT (${databaseUrl.length} chars)` : "MISSING"
  );

  console.log(
    "MYSQL_URL:",
    mysqlUrl ? `PRESENT (${mysqlUrl.length} chars)` : "MISSING"
  );

  console.log(
    "DATABASE_URL starts with:",
    databaseUrl ? databaseUrl.substring(0, 10) + "..." : "(brak)"
  );

  console.log(
    "MYSQL_URL starts with:",
    mysqlUrl ? mysqlUrl.substring(0, 10) + "..." : "(brak)"
  );

  // Na tym etapie używamy wyłącznie DATABASE_URL.
  // MYSQL_URL pokazujemy tylko diagnostycznie.
  if (!databaseUrl) {
    throw new Error(
      "Brak DATABASE_URL w procesie migracji. Railway nie przekazał zmiennej do kontenera."
    );
  }

  const dir = path.resolve(process.cwd(), "db/migrations");

  console.log("Migration directory:", dir);

  if (!fs.existsSync(dir)) {
    throw new Error(`Nie znaleziono katalogu migracji: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Znaleziono migracji: ${files.length}`);

  if (files.length === 0) {
    console.log("Brak plików SQL do wykonania.");
    return;
  }

  const conn = await mysql.createConnection(databaseUrl);

  try {
    for (const file of files) {
      console.log(`>> Wykonuję ${file}`);

      const sql = fs.readFileSync(path.join(dir, file), "utf8");

      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        try {
          await conn.query(statement);
        } catch (e: any) {
          const message = String(e?.message ?? e);

          if (/already exists|Duplicate/i.test(message)) {
            console.log(`↪ Pomijam istniejący element w ${file}`);
            continue;
          }

          console.error(`❌ Błąd w ${file}:`, message.slice(0, 500));
          throw e;
        }
      }

      console.log(`✓ ${file}`);
    }

    console.log("=================================");
    console.log("✓ Wszystkie migracje zastosowane.");
    console.log("=================================");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("❌ Migracja nieudana:", e?.message ?? e);
  process.exit(1);
});
