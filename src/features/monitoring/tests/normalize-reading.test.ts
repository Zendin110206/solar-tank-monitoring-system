import { describe, expect, it } from "vitest";
import { mockTanks } from "../data/mock-tanks";
import { normalizeCatPayload } from "../lib/normalize-reading";

describe("normalizeCatPayload", () => {
  it("normalizes CAT-like telemetry payload into a standard reading", () => {
    const tank = mockTanks[0];
    const receivedAt = new Date("2026-06-25T07:43:08.000Z");

    const reading = normalizeCatPayload({
      payload: {
        device: "demo-tph-01",
        ts: 0,
        distance: 35,
        voltage: 3.85,
        raw: {
          H_cm: 115,
          volume: 3900,
          percent: 78,
          wifi_rssi: -61,
        },
      },
      tank,
      receivedAt,
      readingId: "reading-test",
    });

    expect(reading).toMatchObject({
      id: "reading-test",
      deviceId: "demo-tph-01",
      tankId: "tank-tph-main",
      measuredAt: "2026-06-25T07:43:08.000Z",
      receivedAt: "2026-06-25T07:43:08.000Z",
      sensorDistanceCm: 35,
      fuelHeightCm: 115,
      volumeLiter: 3900,
      fillPercent: 78,
      runtimeHour: 156,
      batteryVolt: 3.85,
      rssiDbm: -61,
    });
  });

  it("calculates height, volume, and percent when device does not send them", () => {
    const tank = mockTanks[0];

    const reading = normalizeCatPayload({
      payload: {
        device: "demo-tph-01",
        distance: 75,
      },
      tank,
      receivedAt: new Date("2026-06-25T07:43:08.000Z"),
    });

    expect(reading.fuelHeightCm).toBe(75);
    expect(reading.volumeLiter).toBeGreaterThan(2400);
    expect(reading.volumeLiter).toBeLessThan(2600);
    expect(reading.fillPercent).toBeGreaterThan(48);
    expect(reading.fillPercent).toBeLessThan(52);
  });

  it("uses fallback device id when payload does not contain a device value", () => {
    const tank = mockTanks[0];

    const reading = normalizeCatPayload({
      payload: {
        distance: 75,
      },
      tank,
      fallbackDeviceId: "demo-fallback-01",
      receivedAt: new Date("2026-06-25T07:43:08.000Z"),
    });

    expect(reading.deviceId).toBe("demo-fallback-01");
  });
});
