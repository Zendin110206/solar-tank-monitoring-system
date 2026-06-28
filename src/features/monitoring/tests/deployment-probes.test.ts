import { afterEach, describe, expect, it } from "vitest";

import {
  getDeploymentHealth,
  getDeploymentReadiness,
} from "../lib/deployment-probes";

const originalStorageDriver = process.env.SOLAR_TANK_STORAGE_DRIVER;
const originalMysqlDatabaseUrl = process.env.MYSQL_DATABASE_URL;

function restoreEnv() {
  if (typeof originalStorageDriver === "undefined") {
    delete process.env.SOLAR_TANK_STORAGE_DRIVER;
  } else {
    process.env.SOLAR_TANK_STORAGE_DRIVER = originalStorageDriver;
  }

  if (typeof originalMysqlDatabaseUrl === "undefined") {
    delete process.env.MYSQL_DATABASE_URL;
  } else {
    process.env.MYSQL_DATABASE_URL = originalMysqlDatabaseUrl;
  }
}

describe("deployment probes", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("reports basic health without exposing secret values", () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";

    const health = getDeploymentHealth(new Date("2026-06-27T02:30:00.000Z"));

    expect(health).toMatchObject({
      status: "ok",
      service: "solar-tank-monitoring-system",
      timestamp: "2026-06-27T02:30:00.000Z",
      storageDriver: "memory",
    });
    expect(JSON.stringify(health)).not.toContain("MYSQL_DATABASE_URL");
    expect(JSON.stringify(health)).not.toContain("local-development-key");
  });

  it("marks memory storage as degraded but reachable", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );

    expect(readiness.ok).toBe(true);
    expect(readiness.status).toBe("degraded");
    expect(readiness.storageDriver).toBe("memory");
    expect(readiness.checks[0]).toMatchObject({
      name: "memory-storage",
      ok: true,
      status: "degraded",
    });
  });

  it("marks mysql storage as not ready when connection settings are missing", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";
    delete process.env.MYSQL_DATABASE_URL;

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );

    expect(readiness.ok).toBe(false);
    expect(readiness.status).toBe("not_ready");
    expect(readiness.storageDriver).toBe("mysql");
    expect(readiness.checks[0]).toMatchObject({
      name: "mysql",
      ok: false,
      status: "error",
    });
  });

  it("does not expose database url or device key in readiness output", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.MYSQL_DATABASE_URL =
      "mysql://secret-user:secret-pass@example/db";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const serialized = JSON.stringify(readiness);

    expect(serialized).not.toContain("secret-user");
    expect(serialized).not.toContain("secret-pass");
    expect(serialized).not.toContain("local-development-key");
  });
});
