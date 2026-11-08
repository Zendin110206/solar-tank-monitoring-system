import "server-only";

import { verifyDeviceKeyHash } from "../../device-key";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { insertProvisioningEvent } from "./events";
import {
  rowToActivationDevice,
  rowToActivationSite,
  rowToActivationTank,
} from "./row-mappers";
import { formatMysqlDateTime } from "./shared";
import type {
  ActivateApprovedDeviceResult,
  PendingDeviceActivationRow,
} from "./types";
import type { PoolConnection } from "mysql2/promise";
import { toBoolean } from "@/lib/database/row-values";

async function findPendingDeviceActivationForUpdate({
  connection,
  deviceIdentifier,
}: {
  connection: PoolConnection;
  deviceIdentifier: string;
}): Promise<PendingDeviceActivationRow | null> {
  const [rows] = await connection.execute<PendingDeviceActivationRow[]>(
    `
      SELECT
        d.id AS device_id,
        d.site_id AS device_site_id,
        d.tank_id AS device_tank_id,
        d.code AS device_code,
        d.label AS device_label,
        d.expected_report_interval_sec,
        d.api_key_hash AS device_api_key_hash,
        d.is_active AS device_is_active,
        s.id AS site_id,
        s.code AS site_code,
        s.name AS site_name,
        s.area_label,
        s.regional_label,
        s.wilayah_label,
        s.latitude,
        s.longitude,
        s.is_active AS site_is_active,
        t.id AS tank_id,
        t.site_id AS tank_site_id,
        t.name AS tank_name,
        t.shape AS tank_shape,
        t.capacity_liter,
        t.diameter_cm,
        t.length_cm,
        t.height_cm,
        t.width_cm,
        t.sensor_mount_height_cm,
        t.low_level_percent,
        t.critical_level_percent,
        t.consumption_liter_per_hour,
        t.is_active AS tank_is_active,
        p.id AS package_id,
        p.package_status,
        p.device_key_hash AS package_device_key_hash,
        r.id AS request_id,
        r.status AS request_status
      FROM monitoring_devices d
      JOIN monitoring_sites s
        ON s.id = d.site_id
      JOIN monitoring_tanks t
        ON t.id = d.tank_id
      JOIN monitoring_device_packages p
        ON p.device_id = d.id
      JOIN monitoring_device_requests r
        ON r.id = p.request_id
      WHERE d.id = ? OR d.code = ?
      ORDER BY p.generated_at DESC, p.id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [deviceIdentifier, deviceIdentifier],
  );

  return rows[0] ?? null;
}

export async function activateApprovedDeviceOnFirstPingFromMysql({
  deviceIdentifier,
  deviceKey,
  receivedAt = new Date(),
}: {
  deviceIdentifier: string;
  deviceKey: string;
  receivedAt?: Date;
}): Promise<ActivateApprovedDeviceResult> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const row = await findPendingDeviceActivationForUpdate({
      connection,
      deviceIdentifier,
    });

    if (!row) {
      await connection.rollback();
      return {
        ok: false,
        reason: "not-found",
      };
    }

    if (
      row.request_status === "revoked" ||
      row.package_status === "revoked" ||
      row.package_status === "expired" ||
      row.package_status === "failed"
    ) {
      await connection.rollback();
      return {
        ok: false,
        reason: "revoked",
      };
    }

    const readyForFirstPing =
      row.request_status === "waiting_first_valid_ping" &&
      row.package_status === "downloaded";
    const alreadyActive =
      row.request_status === "active" &&
      row.package_status === "activated" &&
      toBoolean(row.device_is_active);

    if (!readyForFirstPing && !alreadyActive) {
      await connection.rollback();
      return {
        ok: false,
        reason: "not-ready",
      };
    }

    if (!verifyDeviceKeyHash(deviceKey, row.package_device_key_hash)) {
      await insertProvisioningEvent({
        connection,
        eventType: "device_first_valid_ping_invalid_key",
        metadata: {
          deviceCode: row.device_code,
        },
        packageId: row.package_id,
        requestId: row.request_id,
      });
      await connection.commit();

      return {
        ok: false,
        reason: "invalid-key",
      };
    }

    const activatedAt = formatMysqlDateTime(receivedAt);

    await connection.execute(
      `
        UPDATE monitoring_sites
        SET is_active = TRUE
        WHERE id = ?
      `,
      [row.site_id],
    );
    await connection.execute(
      `
        UPDATE monitoring_tanks
        SET is_active = TRUE
        WHERE id = ?
      `,
      [row.tank_id],
    );
    await connection.execute(
      `
        UPDATE monitoring_devices
        SET is_active = TRUE
        WHERE id = ?
      `,
      [row.device_id],
    );
    await connection.execute(
      `
        UPDATE monitoring_device_packages
        SET
          package_status = 'activated',
          activated_at = COALESCE(activated_at, ?)
        WHERE id = ?
      `,
      [activatedAt, row.package_id],
    );
    await connection.execute(
      `
        UPDATE monitoring_device_requests
        SET status = 'active'
        WHERE id = ?
          AND status IN ('waiting_first_valid_ping', 'active')
      `,
      [row.request_id],
    );
    await insertProvisioningEvent({
      connection,
      eventType: alreadyActive
        ? "device_first_valid_ping_already_active"
        : "device_first_valid_ping_activated",
      metadata: {
        deviceCode: row.device_code,
      },
      packageId: row.package_id,
      requestId: row.request_id,
    });

    await connection.commit();

    return {
      ok: true,
      device: rowToActivationDevice(row),
      site: rowToActivationSite(row),
      tank: rowToActivationTank(row),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
