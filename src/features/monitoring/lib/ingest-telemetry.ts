import { mockDevices } from "../data/mock-devices";
import { mockTanks } from "../data/mock-tanks";
import type {
  CatTelemetryPayload,
  Device,
  Reading,
  Tank,
} from "../types/monitoring";
import {
  isGlobalDeviceKeyFallbackAllowed,
  verifyDeviceKey,
} from "./device-key";
import { normalizeCatPayload } from "./normalize-reading";
import {
  saveMonitoringReading,
  type MonitoringStorageDriver,
} from "./monitoring-storage";

const DEFAULT_LOCAL_DEVICE_KEY = "local-development-key";

type IngestTelemetryInput = {
  deviceIdentifier?: string | null;
  deviceKey?: string | null;
  expectedDeviceKey?: string;
  allowGlobalDeviceKeyFallback?: boolean;
  payload: unknown;
  receivedAt?: Date;
};

type IngestTelemetrySuccess = {
  ok: true;
  status: 201;
  reading: Reading;
  data: {
    readingId: string;
    deviceId: string;
    deviceInternalId: string;
    tankId: string;
    receivedAt: string;
    measuredAt: string;
    sensorDistanceCm: number;
    fuelHeightCm: number;
    volumeLiter: number;
    fillPercent: number;
    runtimeHour: number;
    batteryVolt: number | null;
    rssiDbm: number | null;
    storage: MonitoringStorageDriver;
  };
};

type IngestTelemetryFailure = {
  ok: false;
  status: 400 | 401 | 403 | 404 | 500;
  error: string;
};

export type IngestTelemetryResult =
  | IngestTelemetrySuccess
  | IngestTelemetryFailure;

function isRecord(value: unknown): value is CatTelemetryPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findDeviceByIdentifier(identifier: string): Device | null {
  return (
    mockDevices.find(
      (device) => device.id === identifier || device.code === identifier,
    ) ?? null
  );
}

function findTankByDevice(device: Device): Tank | null {
  return mockTanks.find((tank) => tank.id === device.tankId) ?? null;
}

function readPayloadDeviceIdentifier(
  payload: CatTelemetryPayload,
): string | null {
  const candidates = [
    payload.device,
    payload.device_id,
    payload.raw?.device,
    payload.raw?.device_id,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function isSameDeviceIdentifier(identifier: string, device: Device): boolean {
  return identifier === device.id || identifier === device.code;
}

export function getLocalDeviceKey(
  envValue = process.env.SOLAR_TANK_LOCAL_DEVICE_KEY,
): string {
  const trimmedValue = envValue?.trim();
  return trimmedValue || DEFAULT_LOCAL_DEVICE_KEY;
}

export async function ingestTelemetry({
  deviceIdentifier,
  deviceKey,
  expectedDeviceKey = DEFAULT_LOCAL_DEVICE_KEY,
  allowGlobalDeviceKeyFallback = isGlobalDeviceKeyFallbackAllowed(),
  payload,
  receivedAt = new Date(),
}: IngestTelemetryInput): Promise<IngestTelemetryResult> {
  const cleanDeviceIdentifier = deviceIdentifier?.trim();

  if (!cleanDeviceIdentifier) {
    return {
      ok: false,
      status: 400,
      error: "Header X-Device-Id wajib diisi.",
    };
  }

  const cleanDeviceKey = deviceKey?.trim();

  if (!cleanDeviceKey) {
    return {
      ok: false,
      status: 401,
      error: "Header X-Api-Key atau X-Device-Key wajib diisi.",
    };
  }

  if (!isRecord(payload)) {
    return {
      ok: false,
      status: 400,
      error: "Payload harus berupa object JSON.",
    };
  }

  const device = findDeviceByIdentifier(cleanDeviceIdentifier);

  if (!device) {
    return {
      ok: false,
      status: 404,
      error: "Device tidak terdaftar di data monitoring.",
    };
  }

  if (!device.isActive) {
    return {
      ok: false,
      status: 403,
      error: "Device tidak aktif.",
    };
  }

  if (
    !verifyDeviceKey({
      device,
      suppliedDeviceKey: cleanDeviceKey,
      fallbackDeviceKey: expectedDeviceKey,
      allowGlobalFallback: allowGlobalDeviceKeyFallback,
    })
  ) {
    return {
      ok: false,
      status: 401,
      error: "Device key tidak valid.",
    };
  }

  const payloadDeviceIdentifier = readPayloadDeviceIdentifier(payload);

  if (
    payloadDeviceIdentifier &&
    !isSameDeviceIdentifier(payloadDeviceIdentifier, device)
  ) {
    return {
      ok: false,
      status: 400,
      error: "Identitas device di payload tidak sesuai dengan header.",
    };
  }

  const tank = findTankByDevice(device);

  if (!tank) {
    return {
      ok: false,
      status: 404,
      error: "Konfigurasi tangki untuk device tidak ditemukan.",
    };
  }

  const reading = normalizeCatPayload({
    payload,
    tank,
    fallbackDeviceId: device.id,
    receivedAt,
    readingId: `reading-${device.id}-${receivedAt.getTime()}`,
  });

  try {
    const stored = await saveMonitoringReading({
      ...reading,
      deviceId: device.id,
      tankId: tank.id,
    });

    return {
      ok: true,
      status: 201,
      reading: stored.reading,
      data: {
        readingId: stored.reading.id,
        deviceId: device.code,
        deviceInternalId: device.id,
        tankId: tank.id,
        receivedAt: stored.reading.receivedAt,
        measuredAt: stored.reading.measuredAt,
        sensorDistanceCm: stored.reading.sensorDistanceCm,
        fuelHeightCm: stored.reading.fuelHeightCm,
        volumeLiter: stored.reading.volumeLiter,
        fillPercent: stored.reading.fillPercent,
        runtimeHour: stored.reading.runtimeHour,
        batteryVolt: stored.reading.batteryVolt ?? null,
        rssiDbm: stored.reading.rssiDbm ?? null,
        storage: stored.storage,
      },
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Gagal menyimpan data telemetry ke storage aktif.",
    };
  }
}
