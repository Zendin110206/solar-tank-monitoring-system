import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDownloadToken,
  createFirmwarePackageBundle,
  encryptFirmwarePackage,
} from "../server/firmware-package";
import type {
  MonitoringDeviceRequest,
  MonitoringFirmwareTemplate,
  MonitoringHardwareProfile,
} from "@/features/monitoring/types/monitoring";

// Tes karakterisasi kontrak perangkat v1: paket firmware untuk masukan yang
// sama harus menghasilkan berkas yang sama persis. Nilai acak (kunci enkripsi,
// nonce, token unduh) tidak dibandingkan isinya, hanya formatnya.

const FIXED_NOW = new Date("2026-10-25T03:00:00.000Z");
const TEMPLATE_PATH =
  "firmware/templates/solartank-esp8266-ultrasonic-v1/solar_tank_firmware.ino";

const FIRMWARE_TEMPLATE: MonitoringFirmwareTemplate = {
  displayName: "SolarTank ESP8266 Ultrasonic",
  id: "firmware-template-esp8266-ultrasonic-v1",
  isActive: true,
  sourcePath: "firmware/templates/solartank-esp8266-ultrasonic-v1",
  templateKey: "solartank-esp8266-ultrasonic",
  version: "v1",
};

const HARDWARE_PROFILE: MonitoringHardwareProfile = {
  boardFamily: "esp8266",
  boardLabel: "NodeMCU 1.0 ESP-12E",
  code: "nodemcu-hcsr04-rectangular-v1",
  echoPin: "D6",
  firmwareTemplateId: FIRMWARE_TEMPLATE.id,
  id: "hardware-profile-nodemcu-hcsr04-rectangular-v1",
  isActive: true,
  name: "NodeMCU ESP8266 + HC-SR04 untuk tangki balok",
  reportIntervalMs: 20000,
  sensorType: "HC-SR04",
  supportedTankShape: "rectangular",
  triggerPin: "D5",
};

const DEVICE_REQUEST: MonitoringDeviceRequest = {
  adminReviewedAt: null,
  adminReviewedByUserId: null,
  areaLabel: "Area Contoh",
  regionalLabel: "TREG 5",
  wilayahLabel: "TIF 3",
  capacityLiter: 1200,
  consumptionLiterPerHour: 5.25,
  createdAt: "2026-10-25T02:00:00.000Z",
  criticalLevelPercent: 15,
  deviceCode: "device-contoh-satu-000001",
  deviceLabel: "Sensor fuel STO Contoh Satu",
  deviceSensorType: "fuel",
  dieselEngineCapacityKva: 40,
  firmwareTemplateId: FIRMWARE_TEMPLATE.id,
  hardwareProfileId: HARDWARE_PROFILE.id,
  heightCm: 100,
  id: "device-request-contoh",
  lengthCm: 150,
  loadUnit: "kw",
  loadValue: 20,
  lowLevelPercent: 30,
  cosPhi: 0.8,
  rejectionReason: null,
  requesterEmail: "petugas@example.test",
  requesterUserId: "user-contoh",
  requestCode: "REQ-CONTOH-SATU-20261025-000001",
  sensorMountHeightCm: 110,
  siteCode: "CONTOH-SATU",
  siteName: "STO Contoh Satu",
  status: "pending_admin_review",
  tankShape: "rectangular",
  updatedAt: "2026-10-25T02:00:00.000Z",
  validationWarnings: [],
  widthCm: 80,
};

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function createBundle() {
  return createFirmwarePackageBundle({
    appBaseUrl: "https://ftm.example.test",
    deviceKey: "kunci-perangkat-uji-tetap",
    firmwareTemplate: FIRMWARE_TEMPLATE,
    hardwareProfile: HARDWARE_PROFILE,
    request: DEVICE_REQUEST,
  });
}

describe("paket firmware v1 (dibekukan)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menyalin templat .ino tanpa perubahan satu byte pun", async () => {
    const bundle = await createBundle();
    const ino = bundle.files.find(
      (file) => file.path === "solar_tank_firmware.ino",
    );
    const template = fs.readFileSync(
      path.resolve(process.cwd(), TEMPLATE_PATH),
    );

    expect(ino?.content.equals(template)).toBe(true);
  });

  it("menghasilkan berkas konfigurasi, profil, panduan, dan manifest yang sama untuk masukan yang sama", async () => {
    const bundle = await createBundle();

    expect(bundle.filename).toBe(
      "solartank-device-contoh-satu-000001-20261025.zip",
    );
    expect(bundle.files.map((file) => file.path)).toEqual([
      "solar_tank_firmware.ino",
      "device_config.h",
      "hardware_profile.h",
      "README_LANGKAH_UPLOAD.md",
      "manifest.json",
    ]);

    for (const file of bundle.files) {
      if (file.path === "solar_tank_firmware.ino") {
        continue;
      }
      expect(file.content.toString("utf8")).toMatchSnapshot(file.path);
    }
  });

  it("menghasilkan ZIP yang identik byte demi byte untuk masukan dan waktu yang sama", async () => {
    const first = await createBundle();
    const second = await createBundle();

    expect(first.zipBuffer.subarray(0, 4).toString("hex")).toBe("504b0304");
    expect(sha256(first.zipBuffer)).toBe(sha256(second.zipBuffer));
    expect({
      templateSha256: sha256(
        fs.readFileSync(path.resolve(process.cwd(), TEMPLATE_PATH)),
      ),
      zipSha256: sha256(first.zipBuffer),
    }).toMatchSnapshot();
  });

  it("memakai nilai acak hanya untuk enkripsi dan token unduh, dengan format tetap", () => {
    vi.stubEnv(
      "DEVICE_PACKAGE_ENCRYPTION_KEY",
      Buffer.alloc(32, 7).toString("base64url"),
    );
    const token = createDownloadToken();
    const encrypted = encryptFirmwarePackage(Buffer.from("isi"));
    vi.unstubAllEnvs();

    expect(token).toMatch(/^dpt_[A-Za-z0-9_-]{43}$/);
    expect(encrypted.iv).toHaveLength(12);
    expect(encrypted.authTag).toHaveLength(16);
    expect(createDownloadToken()).not.toBe(token);
    expect(Object.keys(encrypted).sort()).toMatchSnapshot();
  });
});
