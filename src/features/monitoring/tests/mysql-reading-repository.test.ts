import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const connection = {
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    execute: vi.fn(),
    release: vi.fn(),
    rollback: vi.fn(),
  };

  return {
    connection,
    pool: {
      getConnection: vi.fn().mockResolvedValue(connection),
      query: vi.fn(),
    },
  };
});

vi.mock("../lib/mysql-connection", () => ({
  getMysqlPool: () => mocks.pool,
}));

import {
  formatMysqlUtcDateTime,
  listLatestMonitoringReadingsByTankFromMysql,
  parseMysqlDateTimeAsUtc,
  saveMonitoringReadingToMysql,
} from "../lib/mysql-reading-repository";
import type { Reading } from "../types/monitoring";

const reading: Reading = {
  id: "reading-device-tos-1",
  deviceId: "device-tos",
  tankId: "tank-tos",
  measuredAt: "2026-07-11T08:56:58.000Z",
  receivedAt: "2026-07-11T08:56:59.123Z",
  sensorDistanceCm: 13.4,
  fuelHeightCm: 31.07,
  volumeLiter: 173,
  fillPercent: 69.76,
  runtimeHour: 55.05,
  batteryVolt: 3.86,
  rssiDbm: -55,
};

function createReadingRow({
  id,
  receivedAt,
  resolution,
}: {
  id: string;
  receivedAt: string;
  resolution: "latest" | "raw";
}) {
  return {
    id,
    device_id: "device-tos",
    tank_id: "tank-tos",
    measured_at: receivedAt,
    received_at: receivedAt,
    sensor_distance_cm: "13.40",
    fuel_height_cm: "31.07",
    volume_liter: "173.00",
    fill_percent: "69.76",
    runtime_hour: "55.05",
    battery_volt: "3.860",
    rssi_dbm: -55,
    raw_payload: null,
    quality_payload: null,
    reading_resolution: resolution,
    bucket_start: null,
    bucket_end: null,
    sample_count: 1,
    volume_liter_min: null,
    volume_liter_max: null,
    fill_percent_min: null,
    fill_percent_max: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pool.getConnection.mockResolvedValue(mocks.connection);
  mocks.connection.execute.mockResolvedValue([{}, undefined]);
});

describe("mysql reading repository timestamp helpers", () => {
  it("stores ISO timestamps as explicit UTC DATETIME strings", () => {
    expect(formatMysqlUtcDateTime("2026-07-02T03:15:08.123Z")).toBe(
      "2026-07-02 03:15:08.123",
    );
  });

  it("parses MySQL DATETIME strings as UTC, not machine local time", () => {
    expect(parseMysqlDateTimeAsUtc("2026-07-02 03:15:08.123")).toBe(
      "2026-07-02T03:15:08.123Z",
    );
  });
});

describe("mysql reading repository rollup writes", () => {
  it("commits the latest snapshot and five-minute rollup atomically", async () => {
    await expect(saveMonitoringReadingToMysql(reading)).resolves.toEqual(
      reading,
    );

    expect(mocks.connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.connection.execute).toHaveBeenCalledTimes(2);
    expect(mocks.connection.execute.mock.calls[0]?.[0]).toContain(
      "INSERT INTO monitoring_latest_readings",
    );
    expect(mocks.connection.execute.mock.calls[1]?.[0]).toContain(
      "INSERT INTO monitoring_readings",
    );
    expect(mocks.connection.execute.mock.calls[1]?.[0]).toContain("'5m'");
    expect(mocks.connection.commit).toHaveBeenCalledTimes(1);
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.connection.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back both writes when the rollup upsert fails", async () => {
    mocks.connection.execute
      .mockResolvedValueOnce([{}, undefined])
      .mockRejectedValueOnce(new Error("rollup failed"));

    await expect(saveMonitoringReadingToMysql(reading)).rejects.toThrow(
      "rollup failed",
    );

    expect(mocks.connection.commit).not.toHaveBeenCalled();
    expect(mocks.connection.rollback).toHaveBeenCalledTimes(1);
    expect(mocks.connection.release).toHaveBeenCalledTimes(1);
  });
});

describe("mysql reading repository latest selection", () => {
  it("uses fresher history while an old deployment leaves snapshot stale", async () => {
    const staleSnapshot = createReadingRow({
      id: "snapshot-stale",
      receivedAt: "2026-07-10 17:39:48.504",
      resolution: "latest",
    });
    const freshRaw = createReadingRow({
      id: "raw-fresh",
      receivedAt: "2026-07-11 08:56:59.123",
      resolution: "raw",
    });
    mocks.pool.query.mockResolvedValueOnce([
      [staleSnapshot, freshRaw],
      undefined,
    ]);

    const result = await listLatestMonitoringReadingsByTankFromMysql();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "raw-fresh",
      receivedAt: "2026-07-11T08:56:59.123Z",
      resolution: "raw",
    });
    expect(mocks.pool.query.mock.calls[0]?.[0]).toContain("UNION ALL");
  });
});
