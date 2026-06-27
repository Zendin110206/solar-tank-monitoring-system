import { mockReadings } from "../data/mock-readings";
import type { Reading } from "../types/monitoring";

const MAX_MEMORY_READINGS = 500;
const DEMO_LATEST_READING_AGE_MS = 2 * 60 * 1000;

type TelemetryStoreState = {
  readings: Reading[];
};

type TelemetryStoreGlobal = typeof globalThis & {
  __solarTankTelemetryStore?: TelemetryStoreState;
};

const telemetryGlobal = globalThis as TelemetryStoreGlobal;

function cloneReadings(readings: Reading[]): Reading[] {
  return readings.map((reading) => ({ ...reading }));
}

function shiftIsoTimestamp(value: string, offsetMs: number): string {
  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return value;
  }

  return new Date(time + offsetMs).toISOString();
}

function createLiveDemoReadings(now = new Date()): Reading[] {
  const latestReceivedAt = Math.max(
    ...mockReadings.map((reading) => new Date(reading.receivedAt).getTime()),
  );

  if (!Number.isFinite(latestReceivedAt)) {
    return cloneReadings(mockReadings);
  }

  const targetLatestReceivedAt = now.getTime() - DEMO_LATEST_READING_AGE_MS;
  const offsetMs = targetLatestReceivedAt - latestReceivedAt;

  return mockReadings.map((reading) => ({
    ...reading,
    measuredAt: shiftIsoTimestamp(reading.measuredAt, offsetMs),
    receivedAt: shiftIsoTimestamp(reading.receivedAt, offsetMs),
  }));
}

function getStoreState(): TelemetryStoreState {
  telemetryGlobal.__solarTankTelemetryStore ??= {
    readings: createLiveDemoReadings(),
  };

  return telemetryGlobal.__solarTankTelemetryStore;
}

export function getMonitoringReadings(): Reading[] {
  return cloneReadings(getStoreState().readings);
}

export function saveMonitoringReadingToMemory(reading: Reading): Reading {
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

export function resetMonitoringReadings(readings: Reading[] = mockReadings) {
  getStoreState().readings = cloneReadings(readings);
}
