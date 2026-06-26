import type {
  CatTelemetryPayload,
  NormalizeReadingInput,
  Reading,
} from "../types/monitoring";
import { clampNumber, toFiniteNumber } from "./number";
import { calculateRuntimeHours } from "./runtime";
import {
  calculateFillPercent,
  calculateFuelHeightCm,
  calculateTankVolumeLiter,
  getMaxFuelHeightCm,
} from "./tank-volume";

function readPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, key)
    ) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

function pickNumber(
  payload: CatTelemetryPayload,
  paths: string[],
): number | null {
  for (const path of paths) {
    const value = readPath(payload, path);
    const parsed = toFiniteNumber(value);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
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

function resolveMeasuredAt(
  payload: CatTelemetryPayload,
  receivedAt: Date,
): string {
  const tsIso = pickString(payload, ["ts_iso", "raw.ts_iso"]);

  if (tsIso && Number.isFinite(Date.parse(tsIso))) {
    return new Date(tsIso).toISOString();
  }

  const ts = pickNumber(payload, ["ts", "raw.ts"]);

  if (ts !== null && ts > 0) {
    const timestampMs = ts > 1_000_000_000_000 ? ts : ts * 1000;
    return new Date(timestampMs).toISOString();
  }

  return receivedAt.toISOString();
}

export function normalizeCatPayload({
  payload,
  tank,
  fallbackDeviceId,
  receivedAt = new Date(),
  readingId,
}: NormalizeReadingInput): Reading {
  const deviceId =
    pickString(payload, ["device", "device_id", "raw.device"]) ??
    fallbackDeviceId ??
    "unknown-device";

  const sensorDistanceCm =
    pickNumber(payload, [
      "dist_cm",
      "distance_cm",
      "dist",
      "distance",
      "raw.distance_cm",
      "raw.distance",
    ]) ?? 0;

  const maxFuelHeightCm = getMaxFuelHeightCm(tank);
  const explicitFuelHeightCm = pickNumber(payload, [
    "h_cm",
    "H_cm",
    "raw.h_cm",
    "raw.H_cm",
  ]);

  const fuelHeightCm =
    explicitFuelHeightCm !== null
      ? clampNumber(explicitFuelHeightCm, 0, maxFuelHeightCm)
      : calculateFuelHeightCm({
          sensorMountHeightCm: tank.sensorMountHeightCm,
          sensorDistanceCm,
          maxFuelHeightCm,
        });

  const explicitVolumeLiter = pickNumber(payload, [
    "volume_l",
    "volume",
    "raw.volume_l",
    "raw.volume",
  ]);

  const volumeLiter =
    explicitVolumeLiter !== null
      ? clampNumber(explicitVolumeLiter, 0, tank.capacityLiter)
      : calculateTankVolumeLiter(tank, fuelHeightCm);

  const explicitFillPercent = pickNumber(payload, ["percent", "raw.percent"]);

  const fillPercent =
    explicitFillPercent !== null
      ? clampNumber(explicitFillPercent, 0, 100)
      : calculateFillPercent(volumeLiter, tank.capacityLiter);

  const runtimeHour =
    calculateRuntimeHours(volumeLiter, tank.consumptionLiterPerHour) ?? 0;

  const batteryVolt = pickNumber(payload, [
    "voltage",
    "vbatt",
    "vbat",
    "raw.voltage",
    "raw.vbatt",
    "raw.vbat",
  ]);

  const rssiDbm = pickNumber(payload, [
    "rssi",
    "wifi_rssi",
    "raw.rssi",
    "raw.wifi_rssi",
  ]);

  return {
    id: readingId ?? `reading-${deviceId}-${receivedAt.getTime()}`,
    deviceId,
    tankId: tank.id,
    measuredAt: resolveMeasuredAt(payload, receivedAt),
    receivedAt: receivedAt.toISOString(),
    sensorDistanceCm,
    fuelHeightCm,
    volumeLiter,
    fillPercent,
    runtimeHour,
    ...(batteryVolt !== null ? { batteryVolt } : {}),
    ...(rssiDbm !== null ? { rssiDbm } : {}),
    rawPayload: payload,
  };
}
