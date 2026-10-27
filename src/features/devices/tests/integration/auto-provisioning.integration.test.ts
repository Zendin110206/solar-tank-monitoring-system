import type { RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { provisionMonitoringDevice } from "../../server/device-provisioning";
import {
  createTestDatabase,
  type TestDatabase,
} from "@/features/monitoring/tests/integration/mysql-test-database";

// Tes integrasi pembuatan perangkat otomatis dari kiriman pertama pada MySQL asli:
// lokasi, tangki, dan perangkat dibuat dalam satu transaksi; kiriman ulang memperbarui
// baris yang sama; bila satu langkah gagal, tidak ada baris yang tertinggal.

const PROVISIONING_KEY = "kunci-provisioning-integrasi";

let database: TestDatabase;

function payload(deviceIdentifier: string, siteName: string) {
  return {
    device: deviceIdentifier,
    site_code: deviceIdentifier.toUpperCase(),
    site_name: siteName,
    area_label: "Area Contoh",
    lat: -7.651,
    lng: 112.901,
    tank_shape: "rectangular",
    capacity_liter: 540,
    length_cm: 150,
    width_cm: 60,
    height_cm: 60,
    sensor_mount_height_cm: 5,
    low_level_percent: 30,
    critical_level_percent: 15,
    consumption_liter_per_hour: 25,
    distance_cm: 20,
  };
}

function provision(deviceIdentifier: string, siteName = "STO Contoh Otomatis") {
  return provisionMonitoringDevice({
    deviceIdentifier,
    deviceKey: "kunci-perangkat-otomatis",
    allowDeviceAutoProvisioning: true,
    provisioningKey: PROVISIONING_KEY,
    expectedProvisioningKey: PROVISIONING_KEY,
    payload: payload(deviceIdentifier, siteName),
  });
}

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [result] = await database.connection.query<RowDataPacket[]>(
    sql,
    params,
  );
  return result as T[];
}

describe("pembuatan perangkat otomatis di MySQL (integrasi)", () => {
  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await database?.drop();
  });

  it("membuat lokasi, tangki, dan perangkat dari kiriman pertama", async () => {
    const result = await provision("it-auto-01");

    expect(result.ok).toBe(true);
    expect(
      await rows("SELECT id, code, name, is_active FROM monitoring_sites"),
    ).toEqual([
      {
        id: "site-it-auto-01",
        code: "IT-AUTO-01",
        name: "STO Contoh Otomatis",
        is_active: 1,
      },
    ]);
    expect(
      await rows("SELECT id, site_id, shape FROM monitoring_tanks"),
    ).toEqual([
      {
        id: "tank-it-auto-01-main",
        site_id: "site-it-auto-01",
        shape: "rectangular",
      },
    ]);

    const devices = await rows<{
      id: string;
      code: string;
      tank_id: string;
      api_key_hash: string;
    }>("SELECT id, code, tank_id, api_key_hash FROM monitoring_devices");
    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      id: "device-it-auto-01-main",
      code: "it-auto-01",
      tank_id: "tank-it-auto-01-main",
    });
    expect(devices[0].api_key_hash).not.toContain("kunci-perangkat-otomatis");
  });

  it("kiriman ulang memperbarui baris yang sama tanpa duplikat", async () => {
    const result = await provision("it-auto-01", "STO Contoh Diperbarui");

    expect(result.ok).toBe(true);
    expect(await rows("SELECT name FROM monitoring_sites")).toEqual([
      { name: "STO Contoh Diperbarui" },
    ]);
    expect(await rows("SELECT id FROM monitoring_tanks")).toHaveLength(1);
    expect(await rows("SELECT id FROM monitoring_devices")).toHaveLength(1);
  });

  it("membatalkan seluruh transaksi bila satu langkah gagal", async () => {
    await database.connection.query(
      "RENAME TABLE monitoring_devices TO monitoring_devices_ditahan",
    );

    try {
      const result = await provision("it-auto-02");

      expect(result).toEqual({
        ok: false,
        status: 500,
        error: "Gagal membuat registry site/tangki/device dari payload.",
      });
    } finally {
      await database.connection.query(
        "RENAME TABLE monitoring_devices_ditahan TO monitoring_devices",
      );
    }

    expect(
      await rows(
        "SELECT id FROM monitoring_sites WHERE id = 'site-it-auto-02'",
      ),
    ).toEqual([]);
    expect(
      await rows(
        "SELECT id FROM monitoring_tanks WHERE id = 'tank-it-auto-02-main'",
      ),
    ).toEqual([]);
  });
});
