import mysql from "mysql2/promise";

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL;
  const companyId = Number.parseInt(process.env.DEMO_COMPANY_ID ?? "", 10);
  if (!databaseUrl || !companyId) return 1;

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT c.id
       FROM companies c
       INNER JOIN farms f ON f.companyId = c.id
       INNER JOIN houses h ON h.farmId = f.id
       INNER JOIN batches b ON b.houseId = h.id
       WHERE c.id = ?
       LIMIT 1`,
      [companyId],
    );
    return rows.length > 0 ? 0 : 1;
  } finally {
    await connection.end();
  }
}

main().then((code) => { process.exitCode = code; }).catch(() => { process.exitCode = 1; });
