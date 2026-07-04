import { type RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./mysql-connection";
import type { Reading } from "../types/monitoring";

const DEFAULT_MYSQL_READINGS_LIMIT = 1000;
const DEFAULT_MYSQL_TANK_HISTORY_LIMIT = 10_000;

function normalizeLimit(limit: number) {
  return Math.min(Math.max(Math.round(limit), 1), 50_000);
}

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

export function formatMysqlUtcDateTime(value: string): string {
  const date = new Date(value);
  const time = date.getTime();

  if (!Number.isFinite(time)) {
    throw new Error("Timestamp reading tidak valid.");
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

export function parseMysqlDateTimeAsUtc(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const cleanValue = value.trim();
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(cleanValue);
  const normalizedValue = cleanValue.includes("T")
    ? cleanValue
    : cleanValue.replace(" ", "T");
  const isoCandidate = hasExplicitTimezone
    ? normalizedValue
    : `${normalizedValue}Z`;
  const parsedTime = new Date(isoCandidate).getTime();

  if (!Number.isFinite(parsedTime)) {
    throw new Error("Timestamp reading dari MySQL tidak valid.");
  }

  return new Date(parsedTime).toISOString();
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
    measuredAt: parseMysqlDateTimeAsUtc(row.measured_at),
    receivedAt: parseMysqlDateTimeAsUtc(row.received_at),
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
      formatMysqlUtcDateTime(reading.measuredAt),
      formatMysqlUtcDateTime(reading.receivedAt),
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
  const safeLimit = normalizeLimit(limit);
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
    [safeLimit],
  );

  return rows.map(rowToReading).reverse();
}

export async function listLatestMonitoringReadingsByTankFromMysql(): Promise<
  Reading[]
> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<ReadingRow[]>(
    `
      SELECT
        r.id,
        r.device_id,
        r.tank_id,
        r.measured_at,
        r.received_at,
        r.sensor_distance_cm,
        r.fuel_height_cm,
        r.volume_liter,
        r.fill_percent,
        r.runtime_hour,
        r.battery_volt,
        r.rssi_dbm,
        r.raw_payload
      FROM monitoring_readings r
      JOIN monitoring_tanks t
        ON t.id = r.tank_id
       AND t.is_active = TRUE
       AND r.id = (
         SELECT r2.id
         FROM monitoring_readings r2
         WHERE r2.tank_id = t.id
         ORDER BY r2.received_at DESC, r2.id DESC
         LIMIT 1
      )
      ORDER BY r.received_at ASC, r.id ASC
    `,
  );

  return rows.map(rowToReading);
}

export async function listMonitoringReadingsForTankFromMysql(
  tankId: string,
  limit = DEFAULT_MYSQL_TANK_HISTORY_LIMIT,
): Promise<Reading[]> {
  const pool = getMysqlPool();
  const safeLimit = normalizeLimit(limit);
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
      WHERE tank_id = ?
      ORDER BY received_at DESC
      LIMIT ?
    `,
    [tankId, safeLimit],
  );

  return rows.map(rowToReading).reverse();
}
