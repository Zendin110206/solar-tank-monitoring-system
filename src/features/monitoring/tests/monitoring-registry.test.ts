import { afterEach, describe, expect, it } from "vitest";

import { getMonitoringReferenceDataWithSource } from "../lib/monitoring-registry";

const originalStorageDriver = process.env.SOLAR_TANK_STORAGE_DRIVER;

function restoreEnv() {
  if (typeof originalStorageDriver === "undefined") {
    delete process.env.SOLAR_TANK_STORAGE_DRIVER;
  } else {
    process.env.SOLAR_TANK_STORAGE_DRIVER = originalStorageDriver;
  }
}

describe("monitoring registry", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("uses memory reference data when storage driver is memory", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";

    const result = await getMonitoringReferenceDataWithSource();

    expect(result.source).toMatchObject({
      configuredDriver: "memory",
      activeDriver: "memory",
      isFallback: false,
    });
    expect(result.reference.sites.length).toBeGreaterThan(0);
    expect(result.reference.tanks.length).toBeGreaterThan(0);
    expect(result.reference.devices.length).toBeGreaterThan(0);
  });
});
