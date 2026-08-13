import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string {
  // Railway MySQL
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || "3306";
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;

  if (!host || !user || !password || !database) {
    throw new Error(
      [
        "Brak danych MySQL.",
        `MYSQLHOST=${host ? "OK" : "BRAK"}`,
        `MYSQLPORT=${port}`,
        `MYSQLUSER=${user ? "OK" : "BRAK"}`,
        `MYSQLPASSWORD=${password ? "OK" : "BRAK"}`,
        `MYSQLDATABASE=${database ? "OK" : "BRAK"}`,
      ].join(" | "),
    );
  }

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${database}`;
}

async function main() {
  console.log("=== DATABASE DIAGNOSTICS ===");

  const url = getDatabaseUrl();

  console.log("MYSQLHOST: OK");
  console.log("MYSQLPORT:", process.env.MYSQLPORT || "3306");
  console.log("MYSQLUSER: OK");
  console.log("MYSQLPASSWORD: OK");
  console.log("MYSQLDATABASE: OK");

  console.log(">> Łączenie z MySQL...");

  const conn = await mysql.createConnection(url);

  console.log("✓ Połączenie z MySQL działa.");

  const dir = path.resolve("db/migrations");

  if (!fs.existsSync(dir)) {
    throw new Error(`Nie znaleziono katalogu migracji: ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`>> Znaleziono ${files.length} migracji.`);

  for (const file of files) {
    console.log(`>> Migracja: ${file}`);

    const sql = fs.readFileSync(
      path.join(dir, file),
      "utf8",
    );

    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await conn.query(statement);
      } catch (e: any) {
        const message = String(e?.message || e);

        if (
          /already exists/i.test(message) ||
          /Duplicate/i.test(message)
        ) {
          console.log(`↪ Pominięto istniejący element w ${file}`);
          continue;
        }

        console.error(
          `❌ Błąd w ${file}:`,
          message.slice(0, 500),
        );

        throw e;
      }
    }

    console.log(`✓ ${file}`);
  }

  await conn.end();

  console.log("=================================");
  console.log("✓ Wszystkie migracje zastosowane.");
  console.log("=================================");
}

main().catch((e) => {
  console.error(
    "❌ Migracja nieudana:",
    e?.message || e,
  );

  process.exit(1);
});
