import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error(
    "Usage: node scripts/apply-mysql-schema.mjs <path-to-sql-file>",
  );
  process.exit(1);
}

const databaseUrl = process.env.MYSQL_DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(
    "MYSQL_DATABASE_URL wajib diisi sebelum menjalankan script ini.",
  );
  process.exit(1);
}

const sslMode = process.env.MYSQL_SSL_MODE?.trim().toLowerCase();
const ca = process.env.MYSQL_SSL_CA?.replaceAll("\\n", "\n").trim();

const ssl =
  sslMode === "required"
    ? ca
      ? { ca }
      : { rejectUnauthorized: true }
    : undefined;

const absolutePath = path.resolve(sqlFile);
const sql = await fs.readFile(absolutePath, "utf8");

const statements = sql
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

const connection = await mysql.createConnection({
  uri: databaseUrl,
  multipleStatements: false,
  ...(ssl ? { ssl } : {}),
});

try {
  for (const statement of statements) {
    await connection.query(statement);
  }

  console.log(
    `Berhasil menjalankan ${statements.length} statement dari ${sqlFile}`,
  );
} finally {
  await connection.end();
}
