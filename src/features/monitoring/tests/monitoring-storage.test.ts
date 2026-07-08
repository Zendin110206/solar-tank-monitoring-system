import { afterEach, describe, expect, it, vi } from "vitest";

const originalStorageDriver = process.env.SOLAR_TANK_STORAGE_DRIVER;

function restoreEnv() {
  if (typeof originalStorageDriver === "undefined") {
    delete process.env.SOLAR_TANK_STORAGE_DRIVER;
  } else {
    process.env.SOLAR_TANK_STORAGE_DRIVER = originalStorageDriver;
  }
}

describe("monitoring storage", () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("keeps mysql as the active source when mysql readings are empty", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";

    vi.doMock("../lib/mysql-reading-repository", () => ({
      listLatestMonitoringReadingsByTankFromMysql: vi.fn().mockResolvedValue([]),
      listMonitoringReadingsForTankInRangeFromMysql: vi.fn(),
      listMonitoringReadingsForTankFromMysql: vi.fn(),
      listMonitoringReadingsFromMysql: vi.fn().mockResolvedValue([]),
      saveMonitoringReadingToMysql: vi.fn(),
    }));

    const { listMonitoringReadingsWithSource } = await import(
      "../lib/monitoring-storage"
    );

    const result = await listMonitoringReadingsWithSource();

    expect(result.readings).toEqual([]);
    expect(result.source).toMatchObject({
      configuredDriver: "mysql",
      activeDriver: "mysql",
      isFallback: false,
      label: "Database MySQL",
    });
  });

  it("can read only the latest mysql reading per tank for dashboard overview", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";

    const latestReadings = [
      {
        id: "reading-tph-latest",
        deviceId: "device-tph-main",
        tankId: "tank-tph-main",
        measuredAt: "2026-07-02T03:15:08.000Z",
        receivedAt: "2026-07-02T03:15:09.000Z",
        sensorDistanceCm: 24.2,
        fuelHeightCm: 35.77,
        volumeLiter: 321.96,
        fillPercent: 59,
        runtimeHour: 12.69,
      },
    ];

    vi.doMock("../lib/mysql-reading-repository", () => ({
      listLatestMonitoringReadingsByTankFromMysql: vi
        .fn()
        .mockResolvedValue(latestReadings),
      listMonitoringReadingsForTankInRangeFromMysql: vi.fn(),
      listMonitoringReadingsForTankFromMysql: vi.fn(),
      listMonitoringReadingsFromMysql: vi.fn(),
      saveMonitoringReadingToMysql: vi.fn(),
    }));

    const { listLatestMonitoringReadingsByTankWithSource } = await import(
      "../lib/monitoring-storage"
    );

    const result = await listLatestMonitoringReadingsByTankWithSource();

    expect(result.readings).toEqual(latestReadings);
    expect(result.source).toMatchObject({
      configuredDriver: "mysql",
      activeDriver: "mysql",
      isFallback: false,
      label: "Database MySQL",
    });
  });

  it("delegates ranged tank readings to mysql when mysql storage is active", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";

    const readings = [
      {
        id: "reading-in-range",
        deviceId: "device-tph-main",
        tankId: "tank-tph-main",
        measuredAt: "2026-07-02T03:15:08.000Z",
        receivedAt: "2026-07-02T03:15:09.000Z",
        sensorDistanceCm: 24.2,
        fuelHeightCm: 35.77,
        volumeLiter: 321.96,
        fillPercent: 59,
        runtimeHour: 12.69,
      },
    ];
    const listMonitoringReadingsForTankInRangeFromMysql = vi
      .fn()
      .mockResolvedValue(readings);

    vi.doMock("../lib/mysql-reading-repository", () => ({
      listLatestMonitoringReadingsByTankFromMysql: vi.fn(),
      listMonitoringReadingsForTankInRangeFromMysql,
      listMonitoringReadingsForTankFromMysql: vi.fn(),
      listMonitoringReadingsFromMysql: vi.fn(),
      saveMonitoringReadingToMysql: vi.fn(),
    }));

    const { listMonitoringReadingsForTankInRange } = await import(
      "../lib/monitoring-storage"
    );

    const result = await listMonitoringReadingsForTankInRange({
      end: "2026-07-08T17:00:00.000Z",
      start: "2026-07-01T17:00:00.000Z",
      tankId: "tank-tph-main",
    });

    expect(result).toEqual(readings);
    expect(listMonitoringReadingsForTankInRangeFromMysql).toHaveBeenCalledWith({
      end: "2026-07-08T17:00:00.000Z",
      start: "2026-07-01T17:00:00.000Z",
      tankId: "tank-tph-main",
    });
  });
});
