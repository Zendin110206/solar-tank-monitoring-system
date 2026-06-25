import { afterEach, describe, expect, it } from "vitest";
import { mockReadings } from "../data/mock-readings";
import {
  getMonitoringReadings,
  ingestTelemetry,
  resetMonitoringReadings,
} from "../lib/telemetry-store";

describe("telemetry store", () => {
  afterEach(() => {
    resetMonitoringReadings();
  });

  it("stores a normalized CAT payload in memory", () => {
    resetMonitoringReadings();

    const result = ingestTelemetry({
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

    const readings = getMonitoringReadings();
    const storedReading = readings.find(
      (reading) => reading.id === result.data.readingId,
    );

    expect(readings.length).toBe(mockReadings.length + 1);
    expect(storedReading?.deviceId).toBe("device-tph-main");
    expect(storedReading?.tankId).toBe("tank-tph-main");
  });

  it("rejects requests without device identity", () => {
    const result = ingestTelemetry({
      deviceKey: "local-development-key",
      payload: {},
    });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("rejects requests with invalid device key", () => {
    const result = ingestTelemetry({
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

  it("rejects payloads with a different device identity", () => {
    const result = ingestTelemetry({
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
});
