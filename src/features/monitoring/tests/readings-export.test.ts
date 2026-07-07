import { describe, expect, it } from "vitest";

import { createTankReadingsCsv } from "../lib/readings-export";
import type { Reading } from "../types/monitoring";

const baseReading: Reading = {
  deviceId: "device-1",
  fillPercent: 50,
  fuelHeightCm: 30,
  id: "reading-1",
  measuredAt: "2026-07-07T01:00:00.000Z",
  receivedAt: "2026-07-07T01:00:01.000Z",
  runtimeHour: 20,
  sensorDistanceCm: 30,
  tankId: "tank-1",
  volumeLiter: 500,
};

describe("readings export", () => {
  it("creates stable csv output sorted by received time", () => {
    const csv = createTankReadingsCsv([
      {
        ...baseReading,
        id: "reading-2",
        receivedAt: "2026-07-07T02:00:01.000Z",
      },
      {
        ...baseReading,
        id: "reading-1",
        quality: {
          configMismatchReasons: [],
          configSource: "registry",
          configStatus: "normal",
          fillPercentSource: "backend",
          fuelHeightSource: "backend",
          measuredAtSource: "device",
          needsReview: false,
          runtimeSource: "backend",
          volumeSource: "backend",
          warnings: ['nilai "uji", aman'],
        },
        receivedAt: "2026-07-07T01:00:01.000Z",
      },
    ]);
    const lines = csv.trimEnd().split("\r\n");

    expect(lines[0]).toBe(
      "reading_id,tank_id,device_id,measured_at,received_at,sensor_distance_cm,fuel_height_cm,volume_liter,fill_percent,runtime_hour,battery_volt,rssi_dbm,config_status,needs_review,warnings",
    );
    expect(lines[1]).toContain("reading-1");
    expect(lines[2]).toContain("reading-2");
    expect(lines[1]).toContain('"nilai ""uji"", aman"');
  });
});

