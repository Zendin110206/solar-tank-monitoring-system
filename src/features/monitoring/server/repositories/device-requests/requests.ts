import "server-only";

import { buildPendingDeviceRequest } from "../../../lib/device-request";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import type {
  DeviceRequestDraft,
  DeviceRequestStatus,
  MonitoringDeviceRequest,
} from "../../../types/monitoring";
import {
  listFirmwareTemplatesFromMysql,
  listHardwareProfilesFromMysql,
} from "./catalog";
import { insertProvisioningEvent } from "./events";
import { rowToDeviceRequest } from "./row-mappers";
import { formatMysqlDateTime, stringifyJson } from "./shared";
import type {
  CreateDeviceRequestFromMysqlResult,
  DeviceRequestRow,
  ExistingDeviceRequestRow,
  ExistingDeviceRow,
} from "./types";
import type { PoolConnection } from "mysql2/promise";

const BLOCKING_DEVICE_REQUEST_STATUSES: DeviceRequestStatus[] = [
  "pending_admin_review",
  "approved_waiting_package",
  "approved_package_ready",
  "waiting_firmware_download",
  "waiting_first_valid_ping",
  "active",
];

export async function listDeviceRequestsForUserFromMysql(
  requesterUserId: string,
): Promise<MonitoringDeviceRequest[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<DeviceRequestRow[]>(
    `
      SELECT *
      FROM monitoring_device_requests
      WHERE requester_user_id = ?
      ORDER BY created_at DESC, request_code DESC
      LIMIT 100
    `,
    [requesterUserId],
  );

  return rows.map(rowToDeviceRequest);
}

export async function listDeviceRequestsForAdminFromMysql(): Promise<
  MonitoringDeviceRequest[]
> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<DeviceRequestRow[]>(
    `
      SELECT *
      FROM monitoring_device_requests
      ORDER BY
        CASE status
          WHEN 'pending_admin_review' THEN 0
          WHEN 'approved_waiting_package' THEN 1
          WHEN 'approved_package_ready' THEN 2
          ELSE 3
        END ASC,
        created_at DESC,
        request_code DESC
      LIMIT 200
    `,
  );

  return rows.map(rowToDeviceRequest);
}

async function assertDeviceCodeIsAvailable({
  connection,
  deviceCode,
}: {
  connection: PoolConnection;
  deviceCode: string;
}) {
  const [deviceRows] = await connection.execute<ExistingDeviceRow[]>(
    `
      SELECT id
      FROM monitoring_devices
      WHERE code = ?
      LIMIT 1
    `,
    [deviceCode],
  );

  if (deviceRows.length > 0) {
    throw new Error(
      "Kode perangkat sudah dipakai di registry aktif. Gunakan kode perangkat lain.",
    );
  }

  const blockingStatusPlaceholders = BLOCKING_DEVICE_REQUEST_STATUSES.map(
    () => "?",
  ).join(", ");
  const [requestRows] = await connection.execute<ExistingDeviceRequestRow[]>(
    `
      SELECT id, request_code, status
      FROM monitoring_device_requests
      WHERE device_code = ?
        AND status IN (${blockingStatusPlaceholders})
      LIMIT 1
    `,
    [deviceCode, ...BLOCKING_DEVICE_REQUEST_STATUSES],
  );
  const existingRequest = requestRows[0];

  if (existingRequest) {
    throw new Error(
      `Kode perangkat masih dipakai oleh pengajuan ${existingRequest.request_code}. Selesaikan pengajuan itu dulu atau gunakan kode lain.`,
    );
  }
}

export async function createDeviceRequestInMysql({
  draft,
  requesterEmail,
  requesterUserId,
}: {
  draft: DeviceRequestDraft;
  requesterEmail: string;
  requesterUserId: string;
}): Promise<CreateDeviceRequestFromMysqlResult> {
  const [firmwareTemplates, hardwareProfiles] = await Promise.all([
    listFirmwareTemplatesFromMysql({ activeOnly: true }),
    listHardwareProfilesFromMysql({ activeOnly: true }),
  ]);
  const buildResult = buildPendingDeviceRequest({
    draft,
    firmwareTemplates,
    hardwareProfiles,
    requesterEmail,
    requesterUserId,
  });

  if (!buildResult.ok) {
    return {
      ok: false,
      issues: buildResult.validation.errors,
      message: "Data pengajuan device belum lengkap atau belum sesuai.",
    };
  }

  const { request } = buildResult;
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertDeviceCodeIsAvailable({
      connection,
      deviceCode: request.deviceCode,
    });

    await connection.execute(
      `
        INSERT INTO monitoring_device_requests (
          id,
          request_code,
          requester_user_id,
          requester_email,
          status,
          site_code,
          site_name,
          area_label,
          regional_label,
          wilayah_label,
          latitude,
          longitude,
          device_code,
          device_label,
          device_sensor_type,
          tank_shape,
          capacity_liter,
          length_cm,
          width_cm,
          height_cm,
          diameter_cm,
          sensor_mount_height_cm,
          load_value,
          load_unit,
          diesel_engine_capacity_kva,
          cos_phi,
          low_level_percent,
          critical_level_percent,
          consumption_liter_per_hour,
          hardware_profile_id,
          firmware_template_id,
          validation_warnings_json,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        request.id,
        request.requestCode,
        request.requesterUserId,
        request.requesterEmail,
        request.status,
        request.siteCode,
        request.siteName,
        request.areaLabel,
        request.regionalLabel,
        request.wilayahLabel,
        request.latitude ?? null,
        request.longitude ?? null,
        request.deviceCode,
        request.deviceLabel,
        request.deviceSensorType,
        request.tankShape,
        request.capacityLiter,
        request.lengthCm ?? null,
        request.widthCm ?? null,
        request.heightCm ?? null,
        request.diameterCm ?? null,
        request.sensorMountHeightCm,
        request.loadValue,
        request.loadUnit,
        request.dieselEngineCapacityKva,
        request.cosPhi,
        request.lowLevelPercent,
        request.criticalLevelPercent,
        request.consumptionLiterPerHour,
        request.hardwareProfileId,
        request.firmwareTemplateId,
        stringifyJson(request.validationWarnings),
        formatMysqlDateTime(request.createdAt),
        formatMysqlDateTime(request.updatedAt),
      ],
    );

    await insertProvisioningEvent({
      actorUserId: request.requesterUserId,
      connection,
      eventType: "device_request_created",
      metadata: {
        deviceCode: request.deviceCode,
        deviceSensorType: request.deviceSensorType,
        dieselEngineCapacityKva: request.dieselEngineCapacityKva,
        loadUnit: request.loadUnit,
        loadValue: request.loadValue,
        regionalLabel: request.regionalLabel,
        requestCode: request.requestCode,
        siteCode: request.siteCode,
        wilayahLabel: request.wilayahLabel,
      },
      requestId: request.id,
    });

    await connection.commit();

    return {
      ok: true,
      request,
      warnings: buildResult.validation.warnings,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findDeviceRequestForUpdate({
  connection,
  requestId,
}: {
  connection: PoolConnection;
  requestId: string;
}): Promise<MonitoringDeviceRequest> {
  const [rows] = await connection.execute<DeviceRequestRow[]>(
    `
      SELECT *
      FROM monitoring_device_requests
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [requestId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Pengajuan device tidak ditemukan.");
  }

  return rowToDeviceRequest(row);
}

export async function findDeviceRequestById({
  connection,
  requestId,
}: {
  connection: PoolConnection;
  requestId: string;
}): Promise<MonitoringDeviceRequest> {
  const [rows] = await connection.execute<DeviceRequestRow[]>(
    `
      SELECT *
      FROM monitoring_device_requests
      WHERE id = ?
      LIMIT 1
    `,
    [requestId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Pengajuan device tidak ditemukan setelah diperbarui.");
  }

  return rowToDeviceRequest(row);
}
