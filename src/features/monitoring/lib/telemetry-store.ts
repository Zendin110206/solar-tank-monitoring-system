import { mockDevices } from "../data/mock-devices";
import { mockReadings } from "../data/mock-readings";
import { mockTanks } from "../data/mock-tanks";
import type { CatTelemetryPayload, Device, Reading, Tank } from "../types/monitoring";
import { normalizeCatPayload } from "./normalize-reading";

const DEFAULT_LOCAL_DEVICE_KEY = "local-development-key";
const MAX_MEMORY_READINGS = 500;

type TelemetryStoreState = {
  readings: Reading[];
};

type TelemetryStoreGlobal = typeof globalThis & {
  __solarTankTelemetryStore?: TelemetryStoreState;
};

type IngestTelemetryInput = {
  deviceIdentifier?: string | null;
  deviceKey?: string | null;
  expectedDeviceKey?: string;
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
    storage: "memory";
  };
};

type IngestTelemetryFailure = {
  ok: false;
  status: 400 | 401 | 403 | 404;
  error: string;
};

export type IngestTelemetryResult =
  | IngestTelemetrySuccess
  | IngestTelemetryFailure;

const telemetryGlobal = globalThis as TelemetryStoreGlobal;

function cloneReadings(readings: Reading[]): Reading[] {
  return readings.map((reading) => ({ ...reading }));
}

function getStoreState(): TelemetryStoreState {
  telemetryGlobal.__solarTankTelemetryStore ??= {
    readings: cloneReadings(mockReadings),
  };

  return telemetryGlobal.__solarTankTelemetryStore;
}

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

function readPayloadDeviceIdentifier(payload: CatTelemetryPayload): string | null {
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

function saveReading(reading: Reading): Reading {
  const store = getStoreState();
  const readingsWithoutDuplicate = store.readings.filter(
    (item) => item.id !== reading.id,
  );

  store.readings = [...readingsWithoutDuplicate, reading]
    .sort(
      (a, b) =>
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    )
    .slice(-MAX_MEMORY_READINGS);

  return reading;
}

export function getLocalDeviceKey(
  envValue = process.env.SOLAR_TANK_LOCAL_DEVICE_KEY,
): string {
  const trimmedValue = envValue?.trim();
  return trimmedValue || DEFAULT_LOCAL_DEVICE_KEY;
}

export function getMonitoringReadings(): Reading[] {
  return cloneReadings(getStoreState().readings);
}

export function resetMonitoringReadings(readings: Reading[] = mockReadings) {
  getStoreState().readings = cloneReadings(readings);
}

export function ingestTelemetry({
  deviceIdentifier,
  deviceKey,
  expectedDeviceKey = DEFAULT_LOCAL_DEVICE_KEY,
  payload,
  receivedAt = new Date(),
}: IngestTelemetryInput): IngestTelemetryResult {
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

  if (cleanDeviceKey !== expectedDeviceKey) {
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
  const storedReading = saveReading({
    ...reading,
    deviceId: device.id,
    tankId: tank.id,
  });

  return {
    ok: true,
    status: 201,
    reading: storedReading,
    data: {
      readingId: storedReading.id,
      deviceId: device.code,
      deviceInternalId: device.id,
      tankId: tank.id,
      receivedAt: storedReading.receivedAt,
      measuredAt: storedReading.measuredAt,
      sensorDistanceCm: storedReading.sensorDistanceCm,
      fuelHeightCm: storedReading.fuelHeightCm,
      volumeLiter: storedReading.volumeLiter,
      fillPercent: storedReading.fillPercent,
      runtimeHour: storedReading.runtimeHour,
      batteryVolt: storedReading.batteryVolt ?? null,
      rssiDbm: storedReading.rssiDbm ?? null,
      storage: "memory",
    },
  };
}
