import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import mysql, { type Connection, type Pool } from "mysql2/promise";

// Database MySQL sementara untuk tes integrasi. Setiap berkas tes membuat
// database baru, menerapkan migrasi 001-009, lalu menghapusnya kembali.
// Hanya mau berjalan terhadap MySQL di mesin sendiri (localhost/127.0.0.1).

const MIGRATIONS = [
  "001_create_monitoring_core_mysql.sql",
  "002_create_auth_core_mysql.sql",
  "003_extend_auth_recovery_mysql.sql",
  "004_create_device_firmware_provisioning_mysql.sql",
  "005_extend_device_request_operational_fields_mysql.sql",
  "006_create_helpdesk_mysql.sql",
  "007_create_reading_rollup_mysql.sql",
  "008_enforce_unique_telegram_binding_mysql.sql",
  "009_extend_site_location_taxonomy_mysql.sql",
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const DUPLICATE_SCHEMA_ERRORS = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_CHECK_CONSTRAINT_DUP_NAME",
  "ER_FK_DUP_NAME",
]);

type MysqlPoolGlobal = typeof globalThis & { __solarTankMysqlPool?: Pool };

export type TestDatabase = {
  name: string;
  connection: Connection;
  drop: () => Promise<void>;
};

function readAdminUrl(): URL {
  const raw = process.env.FTM_TEST_MYSQL_URL?.trim();

  if (!raw) {
    throw new Error(
      "FTM_TEST_MYSQL_URL belum diisi. Contoh lokal: mysql://root:ftm-local-root@127.0.0.1:3307",
    );
  }

  const url = new URL(raw);

  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `Tes integrasi hanya boleh memakai MySQL lokal, bukan ${url.hostname}.`,
    );
  }

  return url;
}

function splitStatements(sql: string): string[] {
  // Sama dengan cara scripts/apply-mysql-schema.mjs memecah berkas migrasi.
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function applyMigrations(connection: Connection) {
  const migrationsDir = path.resolve(process.cwd(), "database/migrations");

  for (const file of MIGRATIONS) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");

    for (const statement of splitStatements(sql)) {
      try {
        await connection.query(statement);
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";

        if (!DUPLICATE_SCHEMA_ERRORS.has(code)) {
          throw error;
        }
      }
    }
  }
}

async function resetApplicationPool() {
  const mysqlGlobal = globalThis as MysqlPoolGlobal;
  await mysqlGlobal.__solarTankMysqlPool?.end();
  delete mysqlGlobal.__solarTankMysqlPool;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const adminUrl = readAdminUrl();
  const name = `ftm_it_${randomBytes(4).toString("hex")}`;
  const admin = await mysql.createConnection({ uri: adminUrl.toString() });

  await admin.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await admin.end();

  const databaseUrl = new URL(adminUrl.toString());
  databaseUrl.pathname = `/${name}`;

  const connection = await mysql.createConnection({
    uri: databaseUrl.toString(),
    timezone: "Z",
  });
  await applyMigrations(connection);

  await resetApplicationPool();
  process.env.MYSQL_DATABASE_URL = databaseUrl.toString();
  process.env.MYSQL_SSL_MODE = "disabled";
  process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";

  return {
    name,
    connection,
    async drop() {
      await resetApplicationPool();
      await connection.end();
      const cleanup = await mysql.createConnection({
        uri: adminUrl.toString(),
      });
      await cleanup.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await cleanup.end();
    },
  };
}

export async function insertFictionalLocation(
  connection: Connection,
  suffix: string,
  { isActive = true }: { isActive?: boolean } = {},
) {
  const siteId = `site-${suffix}`;
  const tankId = `tank-${suffix}`;
  const deviceId = `device-${suffix}`;

  await connection.query(
    `INSERT INTO monitoring_sites (id, code, name, area_label, regional_label, wilayah_label, is_active)
     VALUES (?, ?, ?, 'Area Contoh', 'TREG 5', 'TIF 3', ?)`,
    [
      siteId,
      `CONTOH-${suffix.toUpperCase()}`,
      `STO Contoh ${suffix}`,
      isActive,
    ],
  );
  await connection.query(
    `INSERT INTO monitoring_tanks (id, site_id, name, shape, capacity_liter, length_cm, width_cm, height_cm,
       sensor_mount_height_cm, low_level_percent, critical_level_percent, consumption_liter_per_hour, is_active)
     VALUES (?, ?, 'Tangki contoh', 'rectangular', 1200, 150, 80, 100, 110, 30, 15, 5.25, ?)`,
    [tankId, siteId, isActive],
  );
  await connection.query(
    `INSERT INTO monitoring_devices (id, site_id, tank_id, code, label, expected_report_interval_sec, api_key_hash, is_active)
     VALUES (?, ?, ?, ?, 'Sensor contoh', 20, NULL, ?)`,
    [deviceId, siteId, tankId, `device-contoh-${suffix}`, isActive],
  );

  return { siteId, tankId, deviceId };
}

export async function insertFictionalUser(
  connection: Connection,
  { id, role }: { id: string; role: "admin" | "user" },
) {
  await connection.query(
    `INSERT INTO auth_users (id, email, username, full_name, role, status, password_hash)
     VALUES (?, ?, ?, ?, ?, 'active', 'tidak-dipakai-di-tes')`,
    [id, `${id}@example.test`, id, `Pengguna ${id}`, role],
  );
}
