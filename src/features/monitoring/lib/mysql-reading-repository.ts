import { type RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./mysql-connection";
import type { Reading } from "../types/monitoring";

const DEFAULT_MYSQL_READINGS_LIMIT = 1000;

type ReadingRow = RowDataPacket & {
  id: string;
  device_id: string;
  tank_id: string;
  measured_at: Date | string;
  received_at: Date | string;
  sensor_distance_cm: number | string;
  fuel_height_cm: number | string;
  volume_liter: number | string;
  fill_percent: number | string;
  runtime_hour: number | string;
  battery_volt: number | string | null;
  rssi_dbm: number | string | null;
  raw_payload: unknown;
};

function toIsoString(value: Date | string): string {
  return new Date(value).toISOString();
}

function toNumber(value: number | string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRawPayload(value: unknown): unknown {
  if (value === null || typeof value === "undefined") {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function rowToReading(row: ReadingRow): Reading {
  const batteryVolt =
    row.battery_volt === null ? undefined : toNumber(row.battery_volt);
  const rssiDbm = row.rssi_dbm === null ? undefined : toNumber(row.rssi_dbm);

  return {
    id: row.id,
    deviceId: row.device_id,
    tankId: row.tank_id,
    measuredAt: toIsoString(row.measured_at),
    receivedAt: toIsoString(row.received_at),
    sensorDistanceCm: toNumber(row.sensor_distance_cm),
    fuelHeightCm: toNumber(row.fuel_height_cm),
    volumeLiter: toNumber(row.volume_liter),
    fillPercent: toNumber(row.fill_percent),
    runtimeHour: toNumber(row.runtime_hour),
    ...(typeof batteryVolt === "number" ? { batteryVolt } : {}),
    ...(typeof rssiDbm === "number" ? { rssiDbm } : {}),
    rawPayload: parseRawPayload(row.raw_payload),
  };
}

export async function saveMonitoringReadingToMysql(
  reading: Reading,
): Promise<Reading> {
  const pool = getMysqlPool();

  await pool.execute(
    `
      INSERT INTO monitoring_readings (
        id,
        device_id,
        tank_id,
        measured_at,
        received_at,
        sensor_distance_cm,
        fuel_height_cm,
        volume_liter,
        fill_percent,
        runtime_hour,
        battery_volt,
        rssi_dbm,
        raw_payload
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        measured_at = VALUES(measured_at),
        received_at = VALUES(received_at),
        sensor_distance_cm = VALUES(sensor_distance_cm),
        fuel_height_cm = VALUES(fuel_height_cm),
        volume_liter = VALUES(volume_liter),
        fill_percent = VALUES(fill_percent),
        runtime_hour = VALUES(runtime_hour),
        battery_volt = VALUES(battery_volt),
        rssi_dbm = VALUES(rssi_dbm),
        raw_payload = VALUES(raw_payload)
    `,
    [
      reading.id,
      reading.deviceId,
      reading.tankId,
      new Date(reading.measuredAt),
      new Date(reading.receivedAt),
      reading.sensorDistanceCm,
      reading.fuelHeightCm,
      reading.volumeLiter,
      reading.fillPercent,
      reading.runtimeHour,
      reading.batteryVolt ?? null,
      reading.rssiDbm ?? null,
      JSON.stringify(reading.rawPayload ?? null),
    ],
  );

  return reading;
}

export async function listMonitoringReadingsFromMysql(
  limit = DEFAULT_MYSQL_READINGS_LIMIT,
): Promise<Reading[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<ReadingRow[]>(
    `
      SELECT
        id,
        device_id,
        tank_id,
        measured_at,
        received_at,
        sensor_distance_cm,
        fuel_height_cm,
        volume_liter,
        fill_percent,
        runtime_hour,
        battery_volt,
        rssi_dbm,
        raw_payload
      FROM monitoring_readings
      ORDER BY received_at DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map(rowToReading).reverse();
}
