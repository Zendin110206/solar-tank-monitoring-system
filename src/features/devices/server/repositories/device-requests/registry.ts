import "server-only";

import type { MonitoringDeviceRequest } from "@/features/monitoring/types/monitoring";
import type { SiteIdRow } from "./types";
import type { PoolConnection } from "mysql2/promise";

function createSafeIdSegment(value: string, fallback: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || fallback
  );
}

function buildRegistryIdsForRequest(request: MonitoringDeviceRequest) {
  const siteSegment = createSafeIdSegment(request.siteCode, "sto");
  const deviceSegment = createSafeIdSegment(request.deviceCode, "device");

  return {
    deviceId: `device-${deviceSegment}`,
    fallbackSiteId: `site-${siteSegment}`,
    tankId: `tank-${deviceSegment}-main`,
  };
}

async function resolveOrCreateInactiveSite({
  connection,
  request,
}: {
  connection: PoolConnection;
  request: MonitoringDeviceRequest;
}): Promise<string> {
  const { fallbackSiteId } = buildRegistryIdsForRequest(request);
  const [siteRows] = await connection.execute<SiteIdRow[]>(
    `
      SELECT id
      FROM monitoring_sites
      WHERE code = ?
      LIMIT 1
      FOR UPDATE
    `,
    [request.siteCode],
  );
  const existingSite = siteRows[0];

  if (existingSite) {
    await connection.execute(
      `
        UPDATE monitoring_sites
        SET
          name = ?,
          area_label = ?,
          regional_label = ?,
          wilayah_label = ?,
          latitude = ?,
          longitude = ?
        WHERE id = ?
      `,
      [
        request.siteName,
        request.areaLabel,
        request.regionalLabel,
        request.wilayahLabel,
        request.latitude ?? null,
        request.longitude ?? null,
        existingSite.id,
      ],
    );

    return existingSite.id;
  }

  await connection.execute(
    `
      INSERT INTO monitoring_sites (
        id,
        code,
        name,
        area_label,
        regional_label,
        wilayah_label,
        latitude,
        longitude,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)
    `,
    [
      fallbackSiteId,
      request.siteCode,
      request.siteName,
      request.areaLabel,
      request.regionalLabel,
      request.wilayahLabel,
      request.latitude ?? null,
      request.longitude ?? null,
    ],
  );

  return fallbackSiteId;
}

export async function createInactiveRegistryForApprovedRequest({
  connection,
  deviceKeyHash,
  expectedReportIntervalSec,
  request,
}: {
  connection: PoolConnection;
  deviceKeyHash: string;
  expectedReportIntervalSec: number;
  request: MonitoringDeviceRequest;
}): Promise<string> {
  const siteId = await resolveOrCreateInactiveSite({ connection, request });
  const { deviceId, tankId } = buildRegistryIdsForRequest(request);

  await connection.execute(
    `
      INSERT INTO monitoring_tanks (
        id,
        site_id,
        name,
        shape,
        capacity_liter,
        diameter_cm,
        length_cm,
        height_cm,
        width_cm,
        sensor_mount_height_cm,
        low_level_percent,
        critical_level_percent,
        consumption_liter_per_hour,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
      ON DUPLICATE KEY UPDATE
        site_id = VALUES(site_id),
        name = VALUES(name),
        shape = VALUES(shape),
        capacity_liter = VALUES(capacity_liter),
        diameter_cm = VALUES(diameter_cm),
        length_cm = VALUES(length_cm),
        height_cm = VALUES(height_cm),
        width_cm = VALUES(width_cm),
        sensor_mount_height_cm = VALUES(sensor_mount_height_cm),
        low_level_percent = VALUES(low_level_percent),
        critical_level_percent = VALUES(critical_level_percent),
        consumption_liter_per_hour = VALUES(consumption_liter_per_hour),
        is_active = FALSE
    `,
    [
      tankId,
      siteId,
      "Tangki utama",
      request.tankShape,
      request.capacityLiter,
      request.diameterCm ?? null,
      request.lengthCm ?? null,
      request.heightCm ?? null,
      request.widthCm ?? null,
      request.sensorMountHeightCm,
      request.lowLevelPercent,
      request.criticalLevelPercent,
      request.consumptionLiterPerHour,
    ],
  );

  await connection.execute(
    `
      INSERT INTO monitoring_devices (
        id,
        site_id,
        tank_id,
        code,
        label,
        expected_report_interval_sec,
        api_key_hash,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
      ON DUPLICATE KEY UPDATE
        site_id = VALUES(site_id),
        tank_id = VALUES(tank_id),
        label = VALUES(label),
        expected_report_interval_sec = VALUES(expected_report_interval_sec),
        api_key_hash = VALUES(api_key_hash),
        is_active = FALSE
    `,
    [
      deviceId,
      siteId,
      tankId,
      request.deviceCode,
      request.deviceLabel,
      expectedReportIntervalSec,
      deviceKeyHash,
    ],
  );

  return deviceId;
}
