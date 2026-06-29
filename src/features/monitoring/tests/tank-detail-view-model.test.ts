import { describe, expect, it } from "vitest";
import {
  buildTankDetail,
  buildTankReadings,
} from "../lib/tank-detail-view-model";

describe("tank detail view model", () => {
  const now = new Date("2026-06-25T07:45:00.000Z");

  it("builds tank detail from monitoring mock data", () => {
    const detail = buildTankDetail("tank-tph-main", { now });

    expect(detail?.siteCode).toBe("TPH");
    expect(detail?.deviceCode).toBe("demo-tph-01");
    expect(detail?.volumeLiter).toBe(3900);
    expect(detail?.fillPercent).toBe(78);
    expect(detail?.status).toBe("online");
  });

  it("returns null when tank id is unknown", () => {
    const detail = buildTankDetail("tank-not-found", { now });

    expect(detail).toBeNull();
  });

  it("builds reading series and keeps latest reading as the last point", () => {
    const readings = buildTankReadings("tank-tph-main", { now });
    const latest = readings.at(-1);

    expect(readings).toHaveLength(8);
    expect(latest?.volumeLiter).toBe(3900);
    expect(latest?.fillPercent).toBe(78);
  });

  it("uses device freshness to mark offline tanks", () => {
    const detail = buildTankDetail("tank-skp-main", { now });

    expect(detail?.status).toBe("offline");
    expect(detail?.statuses.deviceStatus).toBe("offline");
  });

  it("keeps registered tank detail reachable before the first reading arrives", () => {
    const detail = buildTankDetail("tank-nja-main", {
      now,
      readings: [],
    });

    expect(detail).not.toBeNull();
    expect(detail).toMatchObject({
      siteCode: "NJA",
      status: "offline",
      fillPercent: 0,
      volumeLiter: 0,
      lastUpdateLabel: "belum ada data",
      receivedAtLabel: "belum ada data",
      readings: [],
    });
  });

  it("surfaces config mismatch review when latest payload conflicts with registry", () => {
    const detail = buildTankDetail("tank-tph-main", {
      now: new Date("2026-06-28T05:18:12.000Z"),
      readings: [
        {
          id: "reading-real-device",
          deviceId: "device-tph-main",
          tankId: "tank-tph-main",
          measuredAt: "2026-06-28T05:17:57.000Z",
          receivedAt: "2026-06-28T05:18:00.000Z",
          sensorDistanceCm: 10.2,
          fuelHeightCm: 49.8,
          volumeLiter: 448.2,
          fillPercent: 83,
          runtimeHour: 17.93,
          batteryVolt: 3.7,
          rssiDbm: -54,
          rawPayload: {
            tank_shape: "rectangular",
            capacity_liter: 540,
            length_cm: 150,
            width_cm: 60,
            height_cm: 60,
            sensor_mount_height_cm: 60,
            low_level_percent: 30,
            critical_level_percent: 15,
            consumption_liter_per_hour: 25,
            raw: {
              local_H_cm: 49.8,
              local_volume_l: 448.2,
              local_percent: 83,
            },
          },
        },
      ],
    });

    expect(detail).toMatchObject({
      capacityLiter: 540,
      shape: "rectangular",
      shapeLabel: "Tangki balok",
      lengthCm: 150,
      widthCm: 60,
      heightCm: 60,
      sensorMountHeightCm: 60,
      consumptionLiterPerHour: 25,
      volumeLiter: 448.2,
      fillPercent: 83,
      runtimeHour: 17.93,
      status: "warning",
      configReview: {
        status: "config_mismatch",
        needsReview: true,
      },
      dataSources: {
        volumeSource: "device",
        fillPercentSource: "device",
      },
    });
    expect(detail?.configReview.reasons).toEqual(
      expect.arrayContaining([
        "Bentuk tangki payload berbeda dari registry resmi.",
        "Kapasitas tangki payload berbeda 89.2% dari registry.",
      ]),
    );
  });
});
