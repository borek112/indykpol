/**
 * Zastosuj WSZYSTKIE migracje SQL z db/migrations
 * w kolejności alfabetycznej.
 *
 * DATABASE_URL jest dostarczany przez Railway:
 * DATABASE_URL = ${{MySQL.MYSQL_URL}}
 *
 * Skrypt jest idempotentny:
 * błędy typu "already exists" / "Duplicate" są pomijane.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== DATABASE MIGRATION ===");

  // Railway przekazuje tutaj:
  // DATABASE_URL = ${{MySQL.MYSQL_URL}}
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("Brak DATABASE_URL");
  }

  console.log("DATABASE_URL: OK");

  const dir = path.resolve("db/migrations");

  if (!fs.existsSync(dir)) {
    throw new Error(`Nie znaleziono katalogu migracji: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`Znaleziono ${files.length} plików migracji.`);

  if (files.length === 0) {
    console.log("Brak migracji SQL do wykonania.");
    return;
  }

  console.log("Łączenie z MySQL...");

  const conn = await mysql.createConnection(url);

  console.log("✓ Połączono z MySQL.");

  try {
    for (const file of files) {
      console.log(`>> Migracja: ${file}`);

      const filePath = path.join(dir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      const statements = sql
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        try {
          await conn.query(statement);
        } catch (error: any) {
          const message = String(error?.message || error);

          // Element już istnieje — traktujemy jako OK.
          if (
            /already exists/i.test(message) ||
            /Duplicate/i.test(message)
          ) {
            console.log(
              `↪ Pominięto istniejący element w ${file}`,
            );
            continue;
          }

          console.error(
            `❌ Błąd w ${file}:`,
            message.slice(0, 500),
          );

          throw error;
        }
      }

      console.log(`✓ ${file}`);
    }

    console.log("==============================");
    console.log("✓ Wszystkie migracje zastosowane.");
    console.log("==============================");
  } finally {
    await conn.end();
  }
}

main().catch((error: any) => {
  console.error(
    "❌ Migracja nieudana:",
    error?.message || error,
  );

  process.exit(1);
});
