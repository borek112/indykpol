/**
 * Bloody Turkey Enterprise
 *
 * Uruchamia wszystkie migracje SQL z db/migrations
 * w kolejności alfabetycznej.
 *
 * Połączenie z Railway MySQL odbywa się bez DATABASE_URL.
 * Używamy bezpośrednio:
 *
 * MYSQLHOST
 * MYSQLPORT
 * MYSQLUSER
 * MYSQLPASSWORD
 * MYSQLDATABASE
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== DATABASE MIGRATION ===");

  const host = process.env.MYSQLHOST;
  const port = Number(process.env.MYSQLPORT || "3306");
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;

  console.log(`MYSQLHOST present: ${host ? "YES" : "NO"}`);
  console.log(`MYSQLPORT present: ${process.env.MYSQLPORT ? "YES" : "NO"}`);
  console.log(`MYSQLUSER present: ${user ? "YES" : "NO"}`);
  console.log(
    `MYSQLPASSWORD present: ${password ? "YES" : "NO"}`
  );
  console.log(
    `MYSQLDATABASE present: ${database ? "YES" : "NO"}`
  );

  if (!host || !user || !password || !database) {
    throw new Error(
      "Brak wymaganych zmiennych MySQL: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD lub MYSQLDATABASE",
    );
  }

  console.log(`Łączenie z MySQL: ${host}:${port}/${database}`);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  console.log("✓ Połączenie z MySQL działa.");

  const dir = "db/migrations";

  if (!fs.existsSync(dir)) {
    throw new Error(`Brak katalogu migracji: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Znaleziono migracji: ${files.length}`);

  for (const file of files) {
    console.log(`>> Migracja: ${file}`);

    const sql = fs.readFileSync(
      path.join(dir, file),
      "utf8",
    );

    const stmts = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const st of stmts) {
      try {
        await conn.query(st);
      } catch (e: any) {
        const message = String(e?.message ?? e);

        /*
         * Migracje są idempotentne.
         * Nie zatrzymujemy procesu przy obiektach,
         * które już istnieją.
         */
        if (
          /already exists|Duplicate|duplicate key|ER_TABLE_EXISTS_ERROR/i.test(
            message,
          )
        ) {
          console.log(
            `  ↳ pominięto istniejący obiekt: ${message.slice(0, 150)}`,
          );
          continue;
        }

        console.error(
          `✗ Błąd w ${file}: ${message.slice(0, 500)}`,
        );

        throw e;
      }
    }

    console.log(`✓ ${file}`);
  }

  console.log("================================");
  console.log("✓ Wszystkie migracje zastosowane.");
  console.log("================================");

  await conn.end();
}

main().catch((e) => {
  console.error(
    "❌ Migracja nieudana:",
    e?.message ?? e,
  );

  process.exit(1);
});
