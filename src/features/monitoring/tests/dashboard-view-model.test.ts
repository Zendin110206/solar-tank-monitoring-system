import { describe, expect, it } from "vitest";
import { buildDashboardOverview } from "../lib/dashboard-view-model";

describe("dashboard overview view model", () => {
  it("builds dashboard rows from monitoring mock data", () => {
    const overview = buildDashboardOverview({
      now: new Date("2026-06-25T07:45:00.000Z"),
    });

    expect(overview.summary.totalSites).toBe(4);
    expect(overview.summary.totalTanks).toBe(4);
    expect(overview.rows).toHaveLength(4);
  });

  it("calculates status from runtime, level, and device freshness", () => {
    const overview = buildDashboardOverview({
      now: new Date("2026-06-25T07:45:00.000Z"),
    });

    const tph = overview.rows.find((row) => row.code === "TPH");
    const jto = overview.rows.find((row) => row.code === "JTO");
    const skp = overview.rows.find((row) => row.code === "SKP");

    expect(tph?.status).toBe("online");
    expect(jto?.status).toBe("critical");
    expect(skp?.status).toBe("offline");
  });

  it("builds priority rows without hardcoding site order in the page", () => {
    const overview = buildDashboardOverview({
      now: new Date("2026-06-25T07:45:00.000Z"),
    });

    expect(overview.priorityRows.length).toBeGreaterThan(0);
    expect(overview.priorityRows.every((row) => row.status !== "online")).toBe(
      true,
    );
  });

  it("builds health cards and trend bars for dashboard display", () => {
    const overview = buildDashboardOverview({
      now: new Date("2026-06-25T07:45:00.000Z"),
    });

    expect(overview.healthCards).toHaveLength(4);
    expect(overview.healthSegments).toHaveLength(4);
    expect(overview.trendBars).toHaveLength(9);
  });

  it("uses the newest received reading for the detail overview card", () => {
    const overview = buildDashboardOverview({
      now: new Date("2026-06-25T08:10:00.000Z"),
      readings: [
        {
          id: "reading-old-tph",
          deviceId: "device-tph-main",
          tankId: "tank-tph-main",
          measuredAt: "2026-06-25T07:30:00.000Z",
          receivedAt: "2026-06-25T07:30:03.000Z",
          sensorDistanceCm: 40,
          fuelHeightCm: 110,
          volumeLiter: 3600,
          fillPercent: 72,
          runtimeHour: 144,
        },
        {
          id: "reading-new-jto",
          deviceId: "device-jto-main",
          tankId: "tank-jto-main",
          measuredAt: "2026-06-25T08:00:00.000Z",
          receivedAt: "2026-06-25T08:00:05.000Z",
          sensorDistanceCm: 130,
          fuelHeightCm: 20,
          volumeLiter: 700,
          fillPercent: 14,
          runtimeHour: 28,
        },
      ],
    });

    expect(overview.latestRow.code).toBe("JTO");
  });
});
