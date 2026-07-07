import type { Reading } from "../types/monitoring";

const TANK_READING_CSV_HEADERS = [
  "reading_id",
  "tank_id",
  "device_id",
  "measured_at",
  "received_at",
  "sensor_distance_cm",
  "fuel_height_cm",
  "volume_liter",
  "fill_percent",
  "runtime_hour",
  "battery_volt",
  "rssi_dbm",
  "config_status",
  "needs_review",
  "warnings",
] as const;

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (typeof value === "undefined" || value === null) {
    return "";
  }

  const text = String(value);

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function sortReadingsByReceivedAt(readings: Reading[]): Reading[] {
  return [...readings].sort(
    (first, second) =>
      new Date(first.receivedAt).getTime() -
      new Date(second.receivedAt).getTime(),
  );
}

export function createTankReadingsCsv(readings: Reading[]): string {
  const rows = sortReadingsByReceivedAt(readings).map((reading) => [
    reading.id,
    reading.tankId,
    reading.deviceId,
    reading.measuredAt,
    reading.receivedAt,
    reading.sensorDistanceCm,
    reading.fuelHeightCm,
    reading.volumeLiter,
    reading.fillPercent,
    reading.runtimeHour,
    reading.batteryVolt,
    reading.rssiDbm,
    reading.quality?.configStatus,
    reading.quality?.needsReview,
    reading.quality?.warnings.join(" | "),
  ]);

  return [
    TANK_READING_CSV_HEADERS.join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n").concat("\r\n");
}

