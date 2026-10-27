import "server-only";

import { serverEnv } from "@/lib/config/server-env";
import type {
  CatTelemetryPayload,
  Device,
  Site,
  Tank,
  TankShape,
} from "@/features/monitoring/types/monitoring";
import { hashDeviceKey } from "./device-key";
import { saveProvisionedBundleToMysql } from "./repositories/mysql-device-provisioning-repository";
import {
  DEFAULT_REGIONAL_LABEL,
  DEFAULT_WILAYAH_LABEL,
  normalizeRegionalLabel,
  normalizeWilayahLabel,
} from "@/features/monitoring/domain/location-taxonomy";
import { getMonitoringStorageDriver } from "@/features/monitoring/server/monitoring-storage";
import { toFiniteNumber } from "@/features/monitoring/domain/number";
import { extractPayloadTankConfig } from "@/features/monitoring/domain/reading-tank-config";

const DEFAULT_EXPECTED_REPORT_INTERVAL_SEC = 300;
const DEFAULT_LOW_LEVEL_PERCENT = 30;
const DEFAULT_CRITICAL_LEVEL_PERCENT = 15;
const DEFAULT_CONSUMPTION_LITER_PER_HOUR = 25;

type ProvisioningFailure = {
  ok: false;
  status: 400 | 401 | 403 | 500;
  error: string;
};

type ProvisioningSuccess = {
  ok: true;
  site: Site;
  tank: Tank;
  device: Device;
};

export type DeviceProvisioningResult =
  ProvisioningSuccess | ProvisioningFailure;

export type ProvisionMonitoringDeviceInput = {
  deviceIdentifier: string;
  deviceKey: string;
  expectedDeviceKey?: string;
  allowGlobalDeviceKeyFallback?: boolean;
  allowDeviceAutoProvisioning?: boolean;
  provisioningKey?: string | null;
  expectedProvisioningKey?: string | null;
  payload: CatTelemetryPayload;
};

function parseBooleanEnv(value?: string): boolean {
  const cleanValue = value?.trim().toLowerCase();
  return (
    cleanValue === "1" ||
    cleanValue === "true" ||
    cleanValue === "yes" ||
    cleanValue === "on"
  );
}

export function isDeviceAutoProvisioningEnabled(
  envValue = serverEnv.SOLAR_TANK_AUTO_PROVISION_DEVICES,
): boolean {
  return parseBooleanEnv(envValue);
}

export function getExpectedProvisioningKey(
  envValue = serverEnv.SOLAR_TANK_DEVICE_PROVISIONING_KEY,
): string | null {
  const cleanValue = envValue?.trim();
  return cleanValue ? cleanValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProvisioningFailure(
  value: Tank | ProvisioningFailure,
): value is ProvisioningFailure {
  return "ok" in value && value.ok === false;
}

function readPath(payload: CatTelemetryPayload, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, payload);
}

function pickString(
  payload: CatTelemetryPayload,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readPath(payload, path);

    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function pickNumber(
  payload: CatTelemetryPayload,
  paths: string[],
): number | null {
  for (const path of paths) {
    const value = toFiniteNumber(readPath(payload, path));

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function sanitizeSlug(value: string, fallback: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function createSiteCode(payload: CatTelemetryPayload, slug: string): string {
  const payloadCode = pickString(payload, [
    "site_code",
    "site.code",
    "raw.site_code",
  ]);
  const baseCode = payloadCode ?? slug;

  return truncate(
    baseCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    32,
  );
}

function assertValidCoordinate({
  value,
  min,
  max,
  label,
}: {
  value: number | null;
  min: number;
  max: number;
  label: string;
}): number | ProvisioningFailure {
  if (value === null || value < min || value > max) {
    return {
      ok: false,
      status: 400,
      error: `${label} wajib dikirim dan harus berada di rentang ${min} sampai ${max}.`,
    };
  }

  return value;
}

function resolveTankShape(shape: unknown): TankShape | null {
  if (shape === "rectangular") {
    return "rectangular";
  }

  if (
    shape === "horizontal-cylinder" ||
    shape === "cylinder" ||
    shape === "silinder"
  ) {
    return "horizontal-cylinder";
  }

  return null;
}

function calculateCapacityLiter({
  shape,
  lengthCm,
  widthCm,
  heightCm,
  diameterCm,
}: {
  shape: TankShape;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  diameterCm?: number;
}): number | null {
  if (shape === "rectangular" && lengthCm && widthCm && heightCm) {
    return (lengthCm * widthCm * heightCm) / 1000;
  }

  if (shape === "horizontal-cylinder" && lengthCm && diameterCm) {
    const radiusCm = diameterCm / 2;
    return (Math.PI * radiusCm * radiusCm * lengthCm) / 1000;
  }

  return null;
}

function buildProvisionedTank({
  payload,
  siteId,
  tankId,
}: {
  payload: CatTelemetryPayload;
  siteId: string;
  tankId: string;
}): Tank | ProvisioningFailure {
  const payloadConfig = extractPayloadTankConfig(payload);
  const shape = resolveTankShape(payloadConfig?.shape);
  const radiusCm = pickNumber(payload, [
    "radius_cm",
    "radiusCm",
    "tank.radius_cm",
    "tank.radiusCm",
  ]);
  const diameterCm =
    payloadConfig?.diameterCm ?? (radiusCm ? radiusCm * 2 : undefined);
  const lengthCm = payloadConfig?.lengthCm;
  const widthCm = payloadConfig?.widthCm;
  const heightCm = payloadConfig?.heightCm;
  const sensorMountHeightCm = payloadConfig?.sensorMountHeightCm;
  const calculatedCapacityLiter =
    shape === null
      ? null
      : calculateCapacityLiter({
          shape,
          lengthCm,
          widthCm,
          heightCm,
          diameterCm,
        });
  const capacityLiter = payloadConfig?.capacityLiter ?? calculatedCapacityLiter;

  if (!shape) {
    return {
      ok: false,
      status: 400,
      error:
        "Provisioning device baru wajib membawa tank_shape rectangular atau horizontal-cylinder.",
    };
  }

  if (!capacityLiter || capacityLiter <= 0 || !sensorMountHeightCm) {
    return {
      ok: false,
      status: 400,
      error:
        "Provisioning device baru wajib membawa capacity_liter dan sensor_mount_height_cm valid.",
    };
  }

  if (shape === "rectangular" && (!lengthCm || !widthCm || !heightCm)) {
    return {
      ok: false,
      status: 400,
      error:
        "Tangki rectangular wajib membawa length_cm, width_cm, dan height_cm.",
    };
  }

  if (shape === "horizontal-cylinder" && (!lengthCm || !diameterCm)) {
    return {
      ok: false,
      status: 400,
      error:
        "Tangki silinder wajib membawa length_cm dan diameter_cm atau radius_cm.",
    };
  }

  return {
    id: tankId,
    siteId,
    name:
      pickString(payload, ["tank_name", "tank.name", "raw.tank_name"]) ??
      "Tangki utama",
    shape,
    capacityLiter: Math.round(capacityLiter * 100) / 100,
    ...(shape === "horizontal-cylinder" ? { diameterCm } : {}),
    ...(lengthCm ? { lengthCm } : {}),
    ...(shape === "rectangular" ? { widthCm, heightCm } : {}),
    sensorMountHeightCm,
    lowLevelPercent:
      payloadConfig?.lowLevelPercent ?? DEFAULT_LOW_LEVEL_PERCENT,
    criticalLevelPercent:
      payloadConfig?.criticalLevelPercent ?? DEFAULT_CRITICAL_LEVEL_PERCENT,
    consumptionLiterPerHour:
      payloadConfig?.consumptionLiterPerHour ??
      DEFAULT_CONSUMPTION_LITER_PER_HOUR,
    isActive: true,
  };
}

function buildProvisionedBundle({
  deviceIdentifier,
  deviceKey,
  payload,
}: {
  deviceIdentifier: string;
  deviceKey: string;
  payload: CatTelemetryPayload;
}): ProvisioningSuccess | ProvisioningFailure {
  const slug = sanitizeSlug(deviceIdentifier, "device");
  const siteId = truncate(`site-${slug}`, 64);
  const tankId = truncate(`tank-${slug}-main`, 64);
  const deviceId = truncate(`device-${slug}-main`, 64);
  const siteCode = createSiteCode(payload, slug);
  const latitude = assertValidCoordinate({
    value: pickNumber(payload, [
      "lat",
      "latitude",
      "site.lat",
      "site.latitude",
    ]),
    min: -90,
    max: 90,
    label: "Latitude",
  });

  if (typeof latitude !== "number") {
    return latitude;
  }

  const longitude = assertValidCoordinate({
    value: pickNumber(payload, [
      "lng",
      "longitude",
      "lon",
      "site.lng",
      "site.longitude",
      "site.lon",
    ]),
    min: -180,
    max: 180,
    label: "Longitude",
  });

  if (typeof longitude !== "number") {
    return longitude;
  }

  const tank = buildProvisionedTank({
    payload,
    siteId,
    tankId,
  });

  if (isProvisioningFailure(tank)) {
    return tank;
  }

  const site: Site = {
    id: siteId,
    code: siteCode,
    name:
      pickString(payload, ["site_name", "site.name", "raw.site_name"]) ??
      `Site ${siteCode}`,
    areaLabel:
      pickString(payload, [
        "area_label",
        "areaLabel",
        "site.area_label",
        "site.areaLabel",
      ]) ?? "Auto provisioned",
    regionalLabel:
      normalizeRegionalLabel(
        pickString(payload, [
          "regional_label",
          "regionalLabel",
          "site.regional_label",
          "site.regionalLabel",
        ]),
      ) ?? DEFAULT_REGIONAL_LABEL,
    wilayahLabel:
      normalizeWilayahLabel(
        pickString(payload, [
          "wilayah_label",
          "wilayahLabel",
          "site.wilayah_label",
          "site.wilayahLabel",
        ]),
      ) ?? DEFAULT_WILAYAH_LABEL,
    latitude,
    longitude,
    isActive: true,
  };
  const expectedReportIntervalSec =
    pickNumber(payload, [
      "expected_report_interval_sec",
      "expectedReportIntervalSec",
      "device.expected_report_interval_sec",
      "device.expectedReportIntervalSec",
    ]) ?? DEFAULT_EXPECTED_REPORT_INTERVAL_SEC;
  const device: Device = {
    id: deviceId,
    siteId,
    tankId,
    code: deviceIdentifier,
    label:
      pickString(payload, [
        "device_label",
        "deviceLabel",
        "device.label",
        "raw.device_label",
      ]) ?? `Device ${deviceIdentifier}`,
    expectedReportIntervalSec,
    apiKeyHash: hashDeviceKey(deviceKey),
    isActive: true,
  };

  return {
    ok: true,
    site,
    tank,
    device,
  };
}

function isAuthorizedForProvisioning({
  provisioningKey,
  expectedProvisioningKey,
}: Pick<
  ProvisionMonitoringDeviceInput,
  "provisioningKey" | "expectedProvisioningKey"
>): boolean {
  const cleanExpectedProvisioningKey = expectedProvisioningKey?.trim();
  return Boolean(
    cleanExpectedProvisioningKey &&
    provisioningKey?.trim() === cleanExpectedProvisioningKey,
  );
}

export async function provisionMonitoringDevice({
  deviceIdentifier,
  deviceKey,
  allowDeviceAutoProvisioning,
  provisioningKey,
  expectedProvisioningKey,
  payload,
}: ProvisionMonitoringDeviceInput): Promise<DeviceProvisioningResult> {
  if (!allowDeviceAutoProvisioning) {
    return {
      ok: false,
      status: 403,
      error:
        "Device belum terdaftar. Aktifkan auto provisioning sebelum menerima device baru.",
    };
  }

  if (
    !isAuthorizedForProvisioning({
      provisioningKey,
      expectedProvisioningKey,
    })
  ) {
    return {
      ok: false,
      status: 401,
      error: "Provisioning key tidak valid untuk mendaftarkan device baru.",
    };
  }

  const bundle = buildProvisionedBundle({
    deviceIdentifier,
    deviceKey,
    payload,
  });

  if (!bundle.ok) {
    return bundle;
  }

  if (getMonitoringStorageDriver() === "mysql") {
    try {
      await saveProvisionedBundleToMysql(bundle);
    } catch {
      return {
        ok: false,
        status: 500,
        error: "Gagal membuat registry site/tangki/device dari payload.",
      };
    }
  }

  return bundle;
}
