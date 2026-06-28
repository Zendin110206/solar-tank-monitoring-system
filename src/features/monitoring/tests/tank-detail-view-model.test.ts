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
});
