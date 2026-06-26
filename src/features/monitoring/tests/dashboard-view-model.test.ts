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
});
