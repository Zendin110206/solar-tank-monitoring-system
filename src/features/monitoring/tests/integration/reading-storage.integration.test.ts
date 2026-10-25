import type { RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Reading } from "../../types/monitoring";
import { saveMonitoringReadingToMysql } from "../../lib/mysql-reading-repository";
import {
  createTestDatabase,
  insertFictionalLocation,
  type TestDatabase,
} from "./mysql-test-database";

// Tes integrasi: transaksi penyimpanan pembacaan pada MySQL asli. Mengunci
// perilaku snapshot terbaru + ringkasan 5 menit seperti yang berjalan di pilot.

let database: TestDatabase;
let deviceId: string;
let tankId: string;

function reading({
  id,
  measuredAt,
  receivedAt,
  volumeLiter,
  device = deviceId,
}: {
  id: string;
  measuredAt: string;
  receivedAt: string;
  volumeLiter: number;
  device?: string;
}): Reading {
  return {
    id,
    deviceId: device,
    tankId,
    measuredAt,
    receivedAt,
    sensorDistanceCm: 100 - volumeLiter / 12,
    fuelHeightCm: volumeLiter / 12,
    volumeLiter,
    fillPercent: volumeLiter / 12,
    runtimeHour: volumeLiter / 5.25,
    batteryVolt: 3.7,
    rssiDbm: -60,
    rawPayload: { distance_cm: 100 - volumeLiter / 12 },
    quality: {
      measuredAtSource: "device",
      fuelHeightSource: "backend",
      volumeSource: "backend",
      fillPercentSource: "backend",
      runtimeSource: "backend",
      configSource: "registry",
      configStatus: "normal",
      needsReview: false,
      warnings: [],
      configMismatchReasons: [],
    },
  };
}

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [result] = await database.connection.query<RowDataPacket[]>(
    sql,
    params,
  );
  return result as T[];
}

describe("penyimpanan pembacaan di MySQL (integrasi)", () => {
  beforeAll(async () => {
    database = await createTestDatabase();
    ({ deviceId, tankId } = await insertFictionalLocation(
      database.connection,
      "a",
    ));
  });

  afterAll(async () => {
    await database?.drop();
  });

  it("menyimpan snapshot terbaru dan merata-ratakan sampel dalam satu bucket 5 menit", async () => {
    await saveMonitoringReadingToMysql(
      reading({
        id: "r1",
        measuredAt: "2026-10-25T03:00:05.000Z",
        receivedAt: "2026-10-25T03:00:10.000Z",
        volumeLiter: 700,
      }),
    );
    await saveMonitoringReadingToMysql(
      reading({
        id: "r2",
        measuredAt: "2026-10-25T03:00:25.000Z",
        receivedAt: "2026-10-25T03:00:30.000Z",
        volumeLiter: 680,
      }),
    );

    const [latest] = await rows<{
      id: string;
      volume_liter: string;
      received_at: Date;
    }>(
      "SELECT id, volume_liter, received_at FROM monitoring_latest_readings WHERE device_id = ?",
      [deviceId],
    );
    const buckets = await rows<{
      id: string;
      sample_count: number;
      volume_liter: string;
      volume_liter_min: string;
      volume_liter_max: string;
      bucket_start: Date;
      bucket_end: Date;
      reading_resolution: string;
    }>(
      `SELECT id, sample_count, volume_liter, volume_liter_min, volume_liter_max,
              bucket_start, bucket_end, reading_resolution
       FROM monitoring_readings WHERE device_id = ? ORDER BY bucket_start`,
      [deviceId],
    );

    expect(latest).toMatchObject({ id: "r2", volume_liter: "680.00" });
    expect(latest.received_at.toISOString()).toBe("2026-10-25T03:00:30.000Z");
    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toMatchObject({
      id: "rollup-5m-device-a-1792897200000",
      sample_count: 2,
      volume_liter: "690.00",
      volume_liter_min: "680.00",
      volume_liter_max: "700.00",
      reading_resolution: "5m",
    });
    expect(buckets[0].bucket_start.toISOString()).toBe(
      "2026-10-25T03:00:00.000Z",
    );
    expect(buckets[0].bucket_end.toISOString()).toBe(
      "2026-10-25T03:05:00.000Z",
    );
  });

  it("tidak menghitung ulang sampel yang waktu ukurnya sama dengan sampel terakhir (kiriman ulang)", async () => {
    await saveMonitoringReadingToMysql(
      reading({
        id: "r2-ulang",
        measuredAt: "2026-10-25T03:00:25.000Z",
        receivedAt: "2026-10-25T03:00:31.000Z",
        volumeLiter: 680,
      }),
    );

    const [bucket] = await rows<{ sample_count: number; volume_liter: string }>(
      "SELECT sample_count, volume_liter FROM monitoring_readings WHERE id = 'rollup-5m-device-a-1792897200000'",
    );
    const [latest] = await rows<{ id: string }>(
      "SELECT id FROM monitoring_latest_readings WHERE device_id = ?",
      [deviceId],
    );

    expect(bucket).toEqual({ sample_count: 2, volume_liter: "690.00" });
    expect(latest.id).toBe("r2-ulang");
  });

  it("mempertahankan snapshot terbaru bila kiriman yang terlambat datang dan menaruhnya di bucket waktu terimanya", async () => {
    await saveMonitoringReadingToMysql(
      reading({
        id: "r-terlambat",
        measuredAt: "2026-10-25T02:58:50.000Z",
        receivedAt: "2026-10-25T02:59:00.000Z",
        volumeLiter: 720,
      }),
    );

    const [latest] = await rows<{ id: string; received_at: Date }>(
      "SELECT id, received_at FROM monitoring_latest_readings WHERE device_id = ?",
      [deviceId],
    );
    const buckets = await rows<{ id: string; sample_count: number }>(
      "SELECT id, sample_count FROM monitoring_readings WHERE device_id = ? ORDER BY bucket_start",
      [deviceId],
    );

    expect(latest.id).toBe("r2-ulang");
    expect(latest.received_at.toISOString()).toBe("2026-10-25T03:00:31.000Z");
    expect(buckets).toEqual([
      { id: "rollup-5m-device-a-1792896900000", sample_count: 1 },
      { id: "rollup-5m-device-a-1792897200000", sample_count: 2 },
    ]);
  });

  it("membuka bucket baru tepat pada menit kelipatan 5", async () => {
    await saveMonitoringReadingToMysql(
      reading({
        id: "r3",
        measuredAt: "2026-10-25T03:04:59.000Z",
        receivedAt: "2026-10-25T03:05:00.000Z",
        volumeLiter: 660,
      }),
    );

    const buckets = await rows<{ id: string }>(
      "SELECT id FROM monitoring_readings WHERE device_id = ? ORDER BY bucket_start",
      [deviceId],
    );

    expect(buckets.map((bucket) => bucket.id)).toEqual([
      "rollup-5m-device-a-1792896900000",
      "rollup-5m-device-a-1792897200000",
      "rollup-5m-device-a-1792897500000",
    ]);
  });

  it("membatalkan seluruh transaksi bila perangkat tidak ada di registry", async () => {
    await expect(
      saveMonitoringReadingToMysql(
        reading({
          id: "r-asing",
          measuredAt: "2026-10-25T03:10:00.000Z",
          receivedAt: "2026-10-25T03:10:00.000Z",
          volumeLiter: 500,
          device: "device-tidak-ada",
        }),
      ),
    ).rejects.toThrow();

    const [counts] = await rows<{ latest: number; rollup: number }>(
      `SELECT
         (SELECT COUNT(*) FROM monitoring_latest_readings WHERE device_id = 'device-tidak-ada') AS latest,
         (SELECT COUNT(*) FROM monitoring_readings WHERE device_id = 'device-tidak-ada') AS rollup`,
    );

    expect(counts).toEqual({ latest: 0, rollup: 0 });
  });
});
