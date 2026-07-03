import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/features/monitoring/lib/mysql-connection";
import { hmacSha256Hex } from "./auth-crypto";

type RateLimitRow = RowDataPacket & {
  request_count: number;
  window_expires_at: Date;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function hashBucketKey(key: string): string {
  return `hmac-sha256:${hmacSha256Hex(key)}`;
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const pool = getMysqlPool();
  const bucketKey = hashBucketKey(key);
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

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
  const bucket = rows[0];

  if (!bucket || bucket.request_count <= limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((bucket.window_expires_at.getTime() - Date.now()) / 1000),
    ),
  };
}
