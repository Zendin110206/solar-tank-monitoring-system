import type { RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resetMonitoringReadingsInMysql } from "../../lib/mysql-maintenance-repository";
import { saveMonitoringReadingToMysql } from "../../lib/mysql-reading-repository";
import type { Reading } from "../../types/monitoring";
import {
  createTestDatabase,
  insertFictionalLocation,
  insertFictionalUser,
  type TestDatabase,
} from "./mysql-test-database";

// Tes integrasi cakupan aksi reset pembacaan. Mengunci perilaku saat ini:
// reset per tangki hanya menyentuh tangki itu, reset semua menghapus seluruh
// riwayat secara permanen (FTM-002) tetapi tidak menyentuh registry dan akun.

let database: TestDatabase;
let locationA: Awaited<ReturnType<typeof insertFictionalLocation>>;
let locationB: Awaited<ReturnType<typeof insertFictionalLocation>>;

function reading(
  location: { deviceId: string; tankId: string },
  receivedAt: string,
): Reading {
  return {
    id: `${location.deviceId}-${receivedAt}`,
    deviceId: location.deviceId,
    tankId: location.tankId,
    measuredAt: receivedAt,
    receivedAt,
    sensorDistanceCm: 40,
    fuelHeightCm: 60,
    volumeLiter: 720,
    fillPercent: 60,
    runtimeHour: 137.14,
    rawPayload: {},
  };
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const [result] = await database.connection.query<RowDataPacket[]>(
    sql,
    params,
  );
  return Number(result[0].total);
}

async function seedReadings() {
  for (const location of [locationA, locationB]) {
    await saveMonitoringReadingToMysql(
      reading(location, "2026-10-25T03:00:00.000Z"),
    );
    await saveMonitoringReadingToMysql(
      reading(location, "2026-10-25T03:06:00.000Z"),
    );
  }
}

describe("cakupan reset pembacaan di MySQL (integrasi)", () => {
  beforeAll(async () => {
    database = await createTestDatabase();
    locationA = await insertFictionalLocation(database.connection, "a");
    locationB = await insertFictionalLocation(database.connection, "b");
    await insertFictionalUser(database.connection, {
      id: "usr_admin",
      role: "admin",
    });
    await seedReadings();
  });

  afterAll(async () => {
    await database?.drop();
  });

  it("reset satu tangki hanya menghapus pembacaan tangki itu", async () => {
    const result = await resetMonitoringReadingsInMysql({
      tankIds: [locationA.tankId],
    });

    expect(result).toEqual({
      matchedTankCount: 1,
      readingRows: 3,
      totalRows: 3,
    });
    expect(
      await count(
        "SELECT COUNT(*) AS total FROM monitoring_readings WHERE tank_id = ?",
        [locationA.tankId],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT COUNT(*) AS total FROM monitoring_readings WHERE tank_id = ?",
        [locationB.tankId],
      ),
    ).toBe(2);
    expect(
      await count(
        "SELECT COUNT(*) AS total FROM monitoring_latest_readings WHERE tank_id = ?",
        [locationB.tankId],
      ),
    ).toBe(1);
  });

  it("mengabaikan tangki yang tidak ada tanpa menghapus apa pun", async () => {
    expect(
      await resetMonitoringReadingsInMysql({ tankIds: ["tank-tidak-ada"] }),
    ).toEqual({ matchedTankCount: 0, readingRows: 0, totalRows: 0 });
    expect(
      await resetMonitoringReadingsInMysql({ tankIds: [" ", ""] }),
    ).toEqual({ matchedTankCount: 0, readingRows: 0, totalRows: 0 });
    expect(
      await count("SELECT COUNT(*) AS total FROM monitoring_readings"),
    ).toBe(2);
  });

  it("mempertahankan perilaku saat ini: reset semua menghapus seluruh riwayat permanen (FTM-002) tetapi menyisakan registry dan akun", async () => {
    await seedReadings();

    const result = await resetMonitoringReadingsInMysql();

    expect(result).toEqual({
      matchedTankCount: 2,
      readingRows: 6,
      totalRows: 6,
    });
    expect(
      await count(
        `SELECT
           (SELECT COUNT(*) FROM monitoring_readings) +
           (SELECT COUNT(*) FROM monitoring_latest_readings) AS total`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT
           (SELECT COUNT(*) FROM monitoring_sites) +
           (SELECT COUNT(*) FROM monitoring_tanks) +
           (SELECT COUNT(*) FROM monitoring_devices) AS total`,
      ),
    ).toBe(6);
    expect(await count("SELECT COUNT(*) AS total FROM auth_users")).toBe(1);
  });
});
