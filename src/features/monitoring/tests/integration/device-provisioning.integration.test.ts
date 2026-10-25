import type { RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  approveDeviceRequest as approveDeviceRequestInMysql,
  submitDeviceRequest as createDeviceRequestInMysql,
  downloadDevicePackage as downloadDevicePackageByTokenFromMysql,
} from "../../server/device-request-service";
import { activateApprovedDeviceOnFirstPingFromMysql } from "../../lib/mysql-device-request-repository";
import {
  createTestDatabase,
  insertFictionalUser,
  type TestDatabase,
} from "./mysql-test-database";

// Tes integrasi alur pemasangan perangkat pada MySQL asli: pengajuan ->
// persetujuan admin -> unduh paket -> kiriman pertama mengaktifkan perangkat.
// Kunci perangkat dibuat tetap agar kiriman pertama bisa diuji.

const DEVICE_KEY = "kunci-perangkat-integrasi-tetap";

vi.mock("../../lib/device-key", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../lib/device-key")>();
  return { ...original, createDeviceKey: () => DEVICE_KEY };
});

let database: TestDatabase;
let requestId: string;
let deviceCode: string;
let downloadToken: string;

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [result] = await database.connection.query<RowDataPacket[]>(
    sql,
    params,
  );
  return result as T[];
}

async function requestState() {
  const [state] = await rows<{
    request_status: string;
    package_status: string;
    device_active: number;
    site_active: number;
    tank_active: number;
  }>(
    `SELECT r.status AS request_status, p.package_status,
            d.is_active AS device_active, s.is_active AS site_active, t.is_active AS tank_active
     FROM monitoring_device_requests r
     JOIN monitoring_device_packages p ON p.request_id = r.id
     JOIN monitoring_devices d ON d.code = r.device_code
     JOIN monitoring_sites s ON s.id = d.site_id
     JOIN monitoring_tanks t ON t.id = d.tank_id
     WHERE r.id = ?`,
    [requestId],
  );
  return state;
}

async function events(): Promise<string[]> {
  const result = await rows<{ event_type: string }>(
    "SELECT event_type FROM monitoring_device_provisioning_events WHERE request_id = ? ORDER BY created_at, id",
    [requestId],
  );
  return result.map((row) => row.event_type);
}

describe("alur pemasangan perangkat di MySQL (integrasi)", () => {
  beforeAll(async () => {
    vi.stubEnv(
      "DEVICE_PACKAGE_ENCRYPTION_KEY",
      Buffer.alloc(32, 9).toString("base64url"),
    );
    database = await createTestDatabase();
    await insertFictionalUser(database.connection, {
      id: "usr_petugas",
      role: "user",
    });
    await insertFictionalUser(database.connection, {
      id: "usr_admin",
      role: "admin",
    });
  });

  afterAll(async () => {
    await database?.drop();
    vi.unstubAllEnvs();
  });

  it("menyimpan pengajuan baru dengan kapasitas dan konsumsi hasil hitungan", async () => {
    const result = await createDeviceRequestInMysql({
      draft: {
        siteName: "STO Contoh Integrasi",
        areaLabel: "Area Contoh",
        regionalLabel: "TREG 5",
        wilayahLabel: "TIF 3",
        deviceSensorType: "fuel",
        tankShape: "rectangular",
        lengthCm: 150,
        widthCm: 80,
        heightCm: 100,
        sensorMountHeightCm: 110,
        loadValue: 20,
        loadUnit: "kw",
        dieselEngineCapacityKva: 40,
        cosPhi: 0.8,
        hardwareProfileId: "hardware-profile-nodemcu-hcsr04-rectangular-v1",
      },
      requesterEmail: "usr_petugas@example.test",
      requesterUserId: "usr_petugas",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    requestId = result.request.id;
    deviceCode = result.request.deviceCode;
    expect(result.request).toMatchObject({
      status: "pending_admin_review",
      capacityLiter: 1200,
      consumptionLiterPerHour: 5.25,
      lowLevelPercent: 30,
      criticalLevelPercent: 15,
    });
  });

  it("menolak kiriman pertama sebelum pengajuan disetujui", async () => {
    expect(
      await activateApprovedDeviceOnFirstPingFromMysql({
        deviceIdentifier: deviceCode,
        deviceKey: DEVICE_KEY,
      }),
    ).toEqual({ ok: false, reason: "not-found" });
  });

  it("membuat lokasi, tangki, dan perangkat nonaktif beserta paket saat disetujui", async () => {
    const approved = await approveDeviceRequestInMysql({
      adminUserId: "usr_admin",
      appBaseUrl: "https://ftm.example.test",
      requestId,
    });

    downloadToken = approved.downloadToken;
    expect(downloadToken).toMatch(/^dpt_/);
    expect(approved.request.status).toBe("approved_package_ready");
    expect(await requestState()).toEqual({
      request_status: "approved_package_ready",
      package_status: "ready",
      device_active: 0,
      site_active: 0,
      tank_active: 0,
    });
  });

  it("tidak bisa menyetujui pengajuan yang sama dua kali", async () => {
    await expect(
      approveDeviceRequestInMysql({
        adminUserId: "usr_admin",
        appBaseUrl: "https://ftm.example.test",
        requestId,
      }),
    ).rejects.toThrow("Pengajuan device ini sudah diproses sebelumnya.");
  });

  it("menolak kiriman pertama sebelum paket diunduh", async () => {
    expect(
      await activateApprovedDeviceOnFirstPingFromMysql({
        deviceIdentifier: deviceCode,
        deviceKey: DEVICE_KEY,
      }),
    ).toEqual({ ok: false, reason: "not-ready" });
  });

  it("menandai paket terunduh dan menunggu kiriman pertama", async () => {
    const download = await downloadDevicePackageByTokenFromMysql(downloadToken);

    expect(download.ok).toBe(true);
    if (!download.ok) return;
    expect(download.content.subarray(0, 4).toString("hex")).toBe("504b0304");
    expect(await requestState()).toMatchObject({
      request_status: "waiting_first_valid_ping",
      package_status: "downloaded",
      device_active: 0,
    });
  });

  it("mencatat kiriman pertama dengan kunci salah tanpa mengaktifkan", async () => {
    expect(
      await activateApprovedDeviceOnFirstPingFromMysql({
        deviceIdentifier: deviceCode,
        deviceKey: "kunci-salah",
      }),
    ).toEqual({ ok: false, reason: "invalid-key" });
    expect(await requestState()).toMatchObject({ device_active: 0 });
  });

  it("mengaktifkan semuanya hanya sekali walau dua kiriman pertama datang bersamaan", async () => {
    const results = await Promise.all([
      activateApprovedDeviceOnFirstPingFromMysql({
        deviceIdentifier: deviceCode,
        deviceKey: DEVICE_KEY,
      }),
      activateApprovedDeviceOnFirstPingFromMysql({
        deviceIdentifier: deviceCode,
        deviceKey: DEVICE_KEY,
      }),
    ]);

    expect(results.map((result) => result.ok)).toEqual([true, true]);
    expect(await requestState()).toEqual({
      request_status: "active",
      package_status: "activated",
      device_active: 1,
      site_active: 1,
      tank_active: 1,
    });
    const recorded = await events();
    expect(
      recorded.filter((type) => type === "device_first_valid_ping_activated"),
    ).toHaveLength(1);
    expect(
      recorded.filter(
        (type) => type === "device_first_valid_ping_already_active",
      ),
    ).toHaveLength(1);
  });
});
