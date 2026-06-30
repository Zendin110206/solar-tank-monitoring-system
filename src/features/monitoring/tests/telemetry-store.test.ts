import { afterEach, describe, expect, it } from "vitest";
import { mockReadings } from "../data/mock-readings";
import {
  getMonitoringReadings,
  resetMonitoringReadings,
} from "../lib/telemetry-store";
import { ingestTelemetry } from "../lib/ingest-telemetry";
import {
  listMonitoringReadings,
  listMonitoringReadingsWithSource,
} from "../lib/monitoring-storage";

describe("telemetry store", () => {
  afterEach(() => {
    resetMonitoringReadings();
  });

  it("stores a normalized CAT payload in memory", async () => {
    resetMonitoringReadings();

    const result = await ingestTelemetry({
      deviceIdentifier: "demo-tph-01",
      deviceKey: "local-development-key",
      payload: {
        device: "demo-tph-01",
        ts: 0,
        distance: 28,
        voltage: 3.86,
        raw: {
          H_cm: 122,
          volume: 4200,
          percent: 84,
          wifi_rssi: -55,
        },
      },
      receivedAt: new Date("2026-06-26T02:15:00.000Z"),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.data.deviceId).toBe("demo-tph-01");
    expect(result.data.tankId).toBe("tank-tph-main");
    expect(result.data.volumeLiter).toBe(4200);
    expect(result.data.fillPercent).toBe(84);
    expect(result.data.storage).toBe("memory");

    const readings = getMonitoringReadings();
    const storedReading = readings.find(
      (reading) => reading.id === result.data.readingId,
    );

    expect(readings.length).toBe(mockReadings.length + 1);
    expect(storedReading?.deviceId).toBe("device-tph-main");
    expect(storedReading?.tankId).toBe("tank-tph-main");
  });

  it("stores real device payload with config source and review status", async () => {
    resetMonitoringReadings();

    const result = await ingestTelemetry({
      deviceIdentifier: "demo-psn-01",
      deviceKey: "local-development-key",
      payload: {
        device: "demo-psn-01",
        measuredAt: "2026-06-28T05:17:57.000Z",
        tank_shape: "rectangular",
        capacity_liter: 540,
        length_cm: 150,
        width_cm: 60,
        height_cm: 60,
        sensor_mount_height_cm: 60,
        consumption_liter_per_hour: 25,
        distance_cm: 10.2,
        voltage: 3.7,
        rssi: -54,
        raw: {
          local_H_cm: 49.8,
          local_volume_l: 448.2,
          local_percent: 83,
        },
      },
      receivedAt: new Date("2026-06-28T05:18:00.000Z"),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.data).toMatchObject({
      deviceId: "demo-psn-01",
      deviceInternalId: "device-psn-main",
      tankId: "tank-psn-main",
      volumeLiter: 448.2,
      fillPercent: 83,
      runtimeHour: 17.93,
      configStatus: "normal",
      needsReview: false,
      storage: "memory",
    });
    expect(result.reading.quality).toMatchObject({
      configSource: "payload",
      volumeSource: "device",
      fillPercentSource: "device",
    });
  });

  it("rejects requests without device identity", async () => {
    const result = await ingestTelemetry({
      deviceKey: "local-development-key",
      payload: {},
    });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("rejects requests with invalid device key", async () => {
    const result = await ingestTelemetry({
      deviceIdentifier: "demo-tph-01",
      deviceKey: "wrong-key",
      payload: {
        device: "demo-tph-01",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("accepts the registered demo key when global fallback is disabled", async () => {
    const result = await ingestTelemetry({
      deviceIdentifier: "demo-tph-01",
      deviceKey: "demo-tph-key",
      allowGlobalDeviceKeyFallback: false,
      payload: {
        device: "demo-tph-01",
        distance: 30,
        raw: {
          H_cm: 120,
          volume: 4100,
          percent: 82,
        },
      },
      receivedAt: new Date("2026-06-26T03:00:00.000Z"),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.data.deviceId).toBe("demo-tph-01");
    expect(result.data.volumeLiter).toBe(4100);
  });

  it("rejects the global local key when global fallback is disabled", async () => {
    const result = await ingestTelemetry({
      deviceIdentifier: "demo-tph-01",
      deviceKey: "local-development-key",
      allowGlobalDeviceKeyFallback: false,
      payload: {
        device: "demo-tph-01",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("rejects payloads with a different device identity", async () => {
    const result = await ingestTelemetry({
      deviceIdentifier: "demo-tph-01",
      deviceKey: "local-development-key",
      payload: {
        device: "demo-jto-01",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("lists readings through the async storage facade in memory mode", async () => {
    resetMonitoringReadings();

    const readings = await listMonitoringReadings();

    expect(readings).toHaveLength(mockReadings.length);
    expect(readings[0]?.tankId).toBe(mockReadings[0]?.tankId);
  });

  it("reports the active storage source for dashboard diagnostics", async () => {
    resetMonitoringReadings();

    const result = await listMonitoringReadingsWithSource();

    expect(result.readings).toHaveLength(mockReadings.length);
    expect(result.source).toMatchObject({
      configuredDriver: "memory",
      activeDriver: "memory",
      isFallback: false,
      label: "Memory lokal",
    });
  });
});
