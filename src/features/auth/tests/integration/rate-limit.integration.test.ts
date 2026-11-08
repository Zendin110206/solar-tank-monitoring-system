import type { RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkRateLimit } from "../../server/rate-limit";
import {
  createTestDatabase,
  type TestDatabase,
} from "@/features/monitoring/tests/integration/mysql-test-database";

// Tes integrasi pembatas jumlah permintaan pada MySQL asli: hitungan per ember,
// penolakan setelah batas, kunci ember yang di-hash, dan jendela waktu yang dimulai ulang.

let database: TestDatabase;

async function buckets() {
  const [rows] = await database.connection.query<RowDataPacket[]>(
    "SELECT bucket_key, request_count FROM auth_rate_limits ORDER BY bucket_key",
  );
  return rows as { bucket_key: string; request_count: number }[];
}

describe("pembatas jumlah permintaan di MySQL (integrasi)", () => {
  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await database?.drop();
  });

  it("mengizinkan sampai batas lalu menolak dengan waktu tunggu", async () => {
    const options = {
      key: "login:ip:203.0.113.10",
      limit: 2,
      windowMs: 60_000,
    };

    expect(await checkRateLimit(options)).toEqual({ allowed: true });
    expect(await checkRateLimit(options)).toEqual({ allowed: true });

    const blocked = await checkRateLimit(options);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("menyimpan kunci ember dalam bentuk hash, bukan kunci asli", async () => {
    const rows = await buckets();

    expect(rows).toHaveLength(1);
    expect(rows[0].bucket_key).toMatch(/^hmac-sha256:[0-9a-f]{64}$/);
    expect(rows[0].bucket_key).not.toContain("203.0.113.10");
    expect(rows[0].request_count).toBe(3);
  });

  it("menghitung kunci berbeda secara terpisah", async () => {
    expect(
      await checkRateLimit({
        key: "login:ip:203.0.113.11",
        limit: 1,
        windowMs: 60_000,
      }),
    ).toEqual({ allowed: true });
    expect(await buckets()).toHaveLength(2);
  });

  it("memulai ulang hitungan setelah jendela waktu lewat", async () => {
    await database.connection.query(
      "UPDATE auth_rate_limits SET window_expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND)",
    );

    expect(
      await checkRateLimit({
        key: "login:ip:203.0.113.10",
        limit: 2,
        windowMs: 60_000,
      }),
    ).toEqual({ allowed: true });

    const counts = (await buckets()).map((row) => row.request_count);
    expect(counts).toContain(1);
    expect(counts).not.toContain(3);
  });

  it("memakai jendela minimal satu detik", async () => {
    const result = await checkRateLimit({
      key: "login:ip:203.0.113.12",
      limit: 0,
      windowMs: 0,
    });

    // Jam MySQL dan jam aplikasi bisa berbeda sedikit, jadi waktu tunggu 1–2 detik.
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(2);
    }
  });
});
