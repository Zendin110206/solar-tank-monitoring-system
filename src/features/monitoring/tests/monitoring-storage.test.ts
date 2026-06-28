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
});
