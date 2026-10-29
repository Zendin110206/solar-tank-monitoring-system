import "server-only";

import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";

// Pemeriksaan skema auth untuk /api/ready. Berkas ini sengaja tidak memakai repositori
// akun (accounts/) supaya rute yang memuat pemeriksaan kesiapan, termasuk /api/health,
// tidak ikut memuat modul kripto akun (argon2).

// Pastikan indeks unik pengikatan Telegram (migrasi 008) sudah ada; melempar error bila belum.
export async function checkAuthTelegramSchemaFromMysql(): Promise<void> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<Array<RowDataPacket & { count: number }>>(
    `SELECT COUNT(*) AS count
         FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'auth_users'
          AND index_name = 'uniq_auth_users_telegram_chat_id'
          AND non_unique = 0
          AND column_name = 'telegram_chat_id'
          AND seq_in_index = 1`,
  );

  if (Number(rows[0]?.count ?? 0) !== 1) {
    throw new Error("Unique index Telegram binding belum tersedia.");
  }
}
