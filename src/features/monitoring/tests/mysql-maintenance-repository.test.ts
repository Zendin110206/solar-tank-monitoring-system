import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const connection = {
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    query: vi.fn(),
    release: vi.fn(),
    rollback: vi.fn(async () => undefined),
  };

  return {
    connection,
    pool: {
      getConnection: vi.fn(async () => connection),
    },
  };
});

vi.mock("../lib/mysql-connection", () => ({
  getMysqlPool: () => mocks.pool,
}));

import {
  cleanupMonitoringDeviceRequestsInMysql,
  resetMonitoringDeviceDataInMysql,
} from "../lib/mysql-maintenance-repository";

describe("mysql maintenance repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears only operational monitoring data in foreign-key-safe order", async () => {
    const counts = [1, 2, 3, 4, 5, 6, 7, 8];
    let countIndex = 0;

    mocks.connection.query.mockImplementation(async (statement: string) => {
      if (statement.trim().startsWith("SELECT")) {
        return [[{ count: counts[countIndex++] }]];
      }

      return [{ affectedRows: 1 }];
    });

    const result = await resetMonitoringDeviceDataInMysql();
    const statements = mocks.connection.query.mock.calls.map(([statement]) =>
      String(statement).replace(/\s+/g, " ").trim(),
    );

    expect(result.totalRows).toBe(36);
    expect(statements).toEqual([
      "SELECT COUNT(*) AS count FROM monitoring_ingest_events",
      "SELECT COUNT(*) AS count FROM monitoring_device_provisioning_events",
      "SELECT COUNT(*) AS count FROM monitoring_device_packages",
      "SELECT COUNT(*) AS count FROM monitoring_device_requests",
      "SELECT COUNT(*) AS count FROM monitoring_readings",
      "SELECT COUNT(*) AS count FROM monitoring_devices",
      "SELECT COUNT(*) AS count FROM monitoring_tanks",
      "SELECT COUNT(*) AS count FROM monitoring_sites",
      "DELETE FROM monitoring_ingest_events",
      "DELETE FROM monitoring_device_provisioning_events",
      "DELETE FROM monitoring_device_packages",
      "DELETE FROM monitoring_device_requests",
      "DELETE FROM monitoring_readings",
      "DELETE FROM monitoring_devices",
      "DELETE FROM monitoring_tanks",
      "DELETE FROM monitoring_sites",
    ]);
    expect(statements.join(" ")).not.toContain("auth_");
    expect(statements.join(" ")).not.toContain("monitoring_firmware_templates");
    expect(statements.join(" ")).not.toContain("monitoring_hardware_profiles");
    expect(mocks.connection.commit).toHaveBeenCalledTimes(1);
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.connection.release).toHaveBeenCalledTimes(1);
  });

  it("cleans selected device requests without touching shared auth or firmware tables", async () => {
    mocks.connection.query.mockImplementation(async (statement: string) => {
      const cleanStatement = statement.replace(/\s+/g, " ").trim();

      if (
        cleanStatement.startsWith("SELECT") &&
        cleanStatement.includes("FROM monitoring_device_requests WHERE id")
      ) {
        return [[{ id: "request-1" }]];
      }

      if (
        cleanStatement.startsWith("SELECT") &&
        cleanStatement.includes("FROM monitoring_devices d")
      ) {
        return [[{ id: "device-1", site_id: "site-1", tank_id: "tank-1" }]];
      }

      if (
        cleanStatement.startsWith("SELECT") &&
        cleanStatement.includes("FROM monitoring_device_packages")
      ) {
        return [[{ device_id: "device-1", id: "package-1" }]];
      }

      return [{ affectedRows: 1 }];
    });

    const result = await cleanupMonitoringDeviceRequestsInMysql({
      requestIds: ["request-1"],
    });
    const statements = mocks.connection.query.mock.calls.map(([statement]) =>
      String(statement).replace(/\s+/g, " ").trim(),
    );

    expect(result).toMatchObject({
      matchedRequestCount: 1,
      totalRows: 8,
    });
    expect(statements.join(" ")).toContain("NOT EXISTS");
    expect(statements.join(" ")).toContain("DELETE t FROM monitoring_tanks t");
    expect(statements.join(" ")).toContain("DELETE s FROM monitoring_sites s");
    expect(statements.join(" ")).not.toContain("auth_");
    expect(statements.join(" ")).not.toContain("monitoring_firmware_templates");
    expect(statements.join(" ")).not.toContain("monitoring_hardware_profiles");
    expect(mocks.connection.commit).toHaveBeenCalledTimes(1);
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.connection.release).toHaveBeenCalledTimes(1);
  });
});
