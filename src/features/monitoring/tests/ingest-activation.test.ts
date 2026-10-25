import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Device, Reading, Site, Tank } from "../types/monitoring";
import { hashDeviceKey } from "../lib/device-key";
import { ingestTelemetry } from "../lib/ingest-telemetry";
import { getMonitoringReferenceData } from "../lib/monitoring-registry";
import { saveMonitoringReading } from "../lib/monitoring-storage";
import { activateApprovedDeviceOnFirstPingFromMysql } from "../lib/mysql-device-request-repository";

// Tes karakterisasi jalur aktivasi kiriman pertama dan perangkat nonaktif pada
// mode MySQL. Database diganti tiruan; yang dikunci adalah keputusan ingest.

vi.mock("../lib/monitoring-registry", () => ({
  getMonitoringReferenceData: vi.fn(),
}));

vi.mock("../lib/mysql-device-request-repository", () => ({
  activateApprovedDeviceOnFirstPingFromMysql: vi.fn(),
}));

vi.mock("../lib/monitoring-storage", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../lib/monitoring-storage")>();
  return { ...original, saveMonitoringReading: vi.fn() };
});

const RECEIVED_AT = new Date("2026-10-25T03:00:00.000Z");
const DEVICE_KEY = "kunci-perangkat-contoh";

const site: Site = {
  id: "site-contoh",
  code: "CONTOH",
  name: "STO Contoh",
  areaLabel: "Area Contoh",
  isActive: true,
};

const tank: Tank = {
  id: "tank-contoh",
  siteId: site.id,
  name: "Tangki contoh",
  shape: "rectangular",
  capacityLiter: 1200,
  lengthCm: 150,
  widthCm: 80,
  heightCm: 100,
  sensorMountHeightCm: 110,
  lowLevelPercent: 30,
  criticalLevelPercent: 15,
  consumptionLiterPerHour: 5.25,
  isActive: true,
};

function device(overrides: Partial<Device> = {}): Device {
  return {
    id: "device-contoh",
    siteId: site.id,
    tankId: tank.id,
    code: "device-contoh-01",
    label: "Sensor contoh",
    expectedReportIntervalSec: 20,
    apiKeyHash: hashDeviceKey(DEVICE_KEY),
    isActive: true,
    ...overrides,
  };
}

function ingest(identifier = "device-contoh-01", key = DEVICE_KEY) {
  return ingestTelemetry({
    deviceIdentifier: identifier,
    deviceKey: key,
    allowGlobalDeviceKeyFallback: false,
    payload: { device_id: identifier, distance_cm: 30 },
    receivedAt: RECEIVED_AT,
  });
}

describe("ingest: aktivasi kiriman pertama dan perangkat nonaktif (MySQL)", () => {
  beforeEach(() => {
    vi.stubEnv("SOLAR_TANK_STORAGE_DRIVER", "mysql");
    vi.mocked(saveMonitoringReading).mockImplementation(async (reading) => ({
      reading: reading as Reading,
      storage: "mysql",
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("mengaktifkan perangkat yang disetujui pada kiriman valid pertama", async () => {
    vi.mocked(getMonitoringReferenceData).mockResolvedValue({
      devices: [],
      sites: [],
      tanks: [],
    });
    vi.mocked(activateApprovedDeviceOnFirstPingFromMysql).mockResolvedValue({
      ok: true,
      device: device(),
      site,
      tank,
    });

    const result = await ingest();

    expect(activateApprovedDeviceOnFirstPingFromMysql).toHaveBeenCalledWith({
      deviceIdentifier: "device-contoh-01",
      deviceKey: DEVICE_KEY,
      receivedAt: RECEIVED_AT,
    });
    expect(result).toMatchObject({
      ok: true,
      status: 201,
      data: {
        activated: true,
        provisioned: false,
        deviceId: "device-contoh-01",
        tankId: "tank-contoh",
        storage: "mysql",
      },
    });
  });

  it("mempertahankan perilaku saat ini: aktivasi terjadi sebelum isi kiriman divalidasi (FTM-030)", async () => {
    vi.mocked(getMonitoringReferenceData).mockResolvedValue({
      devices: [],
      sites: [],
      tanks: [],
    });
    vi.mocked(activateApprovedDeviceOnFirstPingFromMysql).mockResolvedValue({
      ok: true,
      device: device(),
      site,
      tank,
    });

    const result = await ingestTelemetry({
      deviceIdentifier: "device-contoh-01",
      deviceKey: DEVICE_KEY,
      allowGlobalDeviceKeyFallback: false,
      payload: { device_id: "perangkat-lain", distance_cm: 30 },
      receivedAt: RECEIVED_AT,
    });

    expect(activateApprovedDeviceOnFirstPingFromMysql).toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Identitas device di payload tidak sesuai dengan header.",
    });
  });

  it.each([
    ["invalid-key", 401, "Device key tidak valid."],
    [
      "not-ready",
      403,
      "Perangkat belum siap aktif. Pastikan paket firmware sudah didownload dari link resmi.",
    ],
    [
      "revoked",
      403,
      "Paket firmware atau akses perangkat sudah tidak berlaku.",
    ],
  ] as const)(
    "menerjemahkan alasan aktivasi gagal '%s' menjadi status %i",
    async (reason, status, error) => {
      vi.mocked(getMonitoringReferenceData).mockResolvedValue({
        devices: [],
        sites: [],
        tanks: [],
      });
      vi.mocked(activateApprovedDeviceOnFirstPingFromMysql).mockResolvedValue({
        ok: false,
        reason,
      });

      expect(await ingest()).toEqual({ ok: false, status, error });
    },
  );

  it("membalas 404 bila perangkat tidak ada di registry maupun pengajuan", async () => {
    vi.mocked(getMonitoringReferenceData).mockResolvedValue({
      devices: [],
      sites: [],
      tanks: [],
    });
    vi.mocked(activateApprovedDeviceOnFirstPingFromMysql).mockResolvedValue({
      ok: false,
      reason: "not-found",
    });

    expect(await ingest()).toEqual({
      ok: false,
      status: 404,
      error: "Device tidak terdaftar di data operasional.",
    });
  });

  it("menolak perangkat nonaktif yang ada di registry dengan 403", async () => {
    vi.mocked(getMonitoringReferenceData).mockResolvedValue({
      devices: [device({ isActive: false })],
      sites: [site],
      tanks: [tank],
    });

    expect(await ingest()).toEqual({
      ok: false,
      status: 403,
      error: "Device tidak aktif.",
    });
    expect(activateApprovedDeviceOnFirstPingFromMysql).not.toHaveBeenCalled();
  });

  it("membalas 500 bila registry gagal dibaca dan perangkat tidak ditemukan", async () => {
    vi.mocked(getMonitoringReferenceData).mockRejectedValue(
      new Error("koneksi gagal"),
    );
    vi.mocked(activateApprovedDeviceOnFirstPingFromMysql).mockResolvedValue({
      ok: false,
      reason: "not-found",
    });

    expect(await ingest()).toEqual({
      ok: false,
      status: 500,
      error:
        "Registry site/tangki/device belum bisa dibaca dari storage aktif.",
    });
  });

  it("membalas 500 bila penyimpanan gagal", async () => {
    vi.mocked(getMonitoringReferenceData).mockResolvedValue({
      devices: [device()],
      sites: [site],
      tanks: [tank],
    });
    vi.mocked(saveMonitoringReading).mockRejectedValue(new Error("gagal"));

    expect(await ingest()).toEqual({
      ok: false,
      status: 500,
      error: "Gagal menyimpan data telemetry ke storage aktif.",
    });
  });
});
