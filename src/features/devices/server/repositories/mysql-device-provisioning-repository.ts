import "server-only";

import type {
  Device,
  Site,
  Tank,
} from "@/features/monitoring/types/monitoring";
import {
  DEFAULT_REGIONAL_LABEL,
  DEFAULT_WILAYAH_LABEL,
} from "@/features/monitoring/domain/location-taxonomy";
import { getMysqlPool } from "@/lib/database/mysql-connection";

// Simpan lokasi, tangki, dan perangkat hasil pembuatan otomatis dalam satu transaksi.
// Baris yang sudah ada diperbarui; bila satu langkah gagal, semua langkah dibatalkan.
export async function saveProvisionedBundleToMysql({
  site,
  tank,
  device,
}: {
  site: Site;
  tank: Tank;
  device: Device;
}): Promise<void> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          area_label = VALUES(area_label),
          regional_label = VALUES(regional_label),
          wilayah_label = VALUES(wilayah_label),
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          is_active = TRUE
      `,
      [
        site.id,
        site.code,
        site.name,
        site.areaLabel,
        site.regionalLabel ?? DEFAULT_REGIONAL_LABEL,
        site.wilayahLabel ?? DEFAULT_WILAYAH_LABEL,
        site.latitude,
        site.longitude,
      ],
    );

    await connection.query(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
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
          is_active = TRUE
      `,
      [
        tank.id,
        tank.siteId,
        tank.name,
        tank.shape,
        tank.capacityLiter,
        tank.diameterCm ?? null,
        tank.lengthCm ?? null,
        tank.heightCm ?? null,
        tank.widthCm ?? null,
        tank.sensorMountHeightCm,
        tank.lowLevelPercent,
        tank.criticalLevelPercent,
        tank.consumptionLiterPerHour,
      ],
    );

    await connection.query(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          site_id = VALUES(site_id),
          tank_id = VALUES(tank_id),
          label = VALUES(label),
          expected_report_interval_sec = VALUES(expected_report_interval_sec),
          api_key_hash = VALUES(api_key_hash),
          is_active = TRUE
      `,
      [
        device.id,
        device.siteId,
        device.tankId,
        device.code,
        device.label,
        device.expectedReportIntervalSec,
        device.apiKeyHash ?? null,
      ],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
