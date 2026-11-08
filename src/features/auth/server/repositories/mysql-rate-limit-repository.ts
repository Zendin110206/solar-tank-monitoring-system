import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql-connection";
import { hmacSha256Hex } from "../auth-crypto";

type RateLimitRow = RowDataPacket & {
  request_count: number;
  window_expires_at: Date;
};

function hashBucketKey(key: string): string {
  return `hmac-sha256:${hmacSha256Hex(key)}`;
}

// Catat satu permintaan pada ember milik `key` lalu kembalikan isi ember itu.
// Bila jendela waktu ember sudah lewat, hitungan dimulai ulang dari 1.
export async function recordRateLimitRequest(
  key: string,
  windowSeconds: number,
): Promise<RateLimitRow | undefined> {
  const pool = getMysqlPool();
  const bucketKey = hashBucketKey(key);

  await pool.execute(
    `INSERT INTO auth_rate_limits
      (bucket_key, request_count, window_expires_at)
     VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND))
     ON DUPLICATE KEY UPDATE
       request_count = CASE
         WHEN window_expires_at <= UTC_TIMESTAMP(3) THEN 1
         ELSE request_count + 1
       END,
       window_expires_at = CASE
         WHEN window_expires_at <= UTC_TIMESTAMP(3)
           THEN DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND)
         ELSE window_expires_at
       END`,
    [bucketKey, windowSeconds, windowSeconds],
  );

  const [rows] = await pool.execute<RateLimitRow[]>(
    `SELECT request_count, window_expires_at
       FROM auth_rate_limits
      WHERE bucket_key = ?
      LIMIT 1`,
    [bucketKey],
  );

  return rows[0];
}
