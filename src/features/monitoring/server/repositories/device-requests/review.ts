import "server-only";

import { getMysqlPool } from "../../../../../lib/database/mysql-connection";
import type { MonitoringDeviceRequest } from "../../../types/monitoring";
import { insertProvisioningEvent } from "./events";
import { createPackageForRequest } from "./package-generation";
import { findDeviceRequestById, findDeviceRequestForUpdate } from "./requests";
import { formatMysqlDateTime } from "./shared";
import type { ApprovedDeviceRequestPackageResult } from "./types";

function normalizeRejectionReason(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function approveDeviceRequestInMysql({
  adminUserId,
  appBaseUrl,
  requestId,
}: {
  adminUserId: string;
  appBaseUrl: string;
  requestId: string;
}): Promise<ApprovedDeviceRequestPackageResult> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();
  const reviewedAt = new Date();

  try {
    await connection.beginTransaction();
    const request = await findDeviceRequestForUpdate({ connection, requestId });

    if (request.status !== "pending_admin_review") {
      throw new Error("Pengajuan device ini sudah diproses sebelumnya.");
    }

    const packageResult = await createPackageForRequest({
      appBaseUrl,
      connection,
      request,
    });

    await connection.execute(
      `
        UPDATE monitoring_device_requests
        SET
          status = 'approved_package_ready',
          admin_reviewed_by_user_id = ?,
          admin_reviewed_at = ?,
          rejection_reason = NULL
        WHERE id = ?
      `,
      [adminUserId, formatMysqlDateTime(reviewedAt), requestId],
    );

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: "firmware_package_created",
      metadata: {
        deviceCode: request.deviceCode,
        packageChecksumSha256: packageResult.package.packageChecksumSha256,
        packageFilename: packageResult.package.packageFilename,
        requestCode: request.requestCode,
      },
      packageId: packageResult.package.id,
      requestId,
    });

    const updatedRequest = await findDeviceRequestById({
      connection,
      requestId,
    });
    await connection.commit();

    return {
      downloadExpiresAt: packageResult.downloadExpiresAt,
      downloadToken: packageResult.downloadToken,
      package: packageResult.package,
      request: updatedRequest,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function revokeDeviceProvisioningInMysql({
  adminUserId,
  requestId,
}: {
  adminUserId: string;
  requestId: string;
}): Promise<MonitoringDeviceRequest> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const request = await findDeviceRequestForUpdate({ connection, requestId });

    if (
      request.status === "pending_admin_review" ||
      request.status === "rejected" ||
      request.status === "revoked"
    ) {
      throw new Error(
        "Pengajuan ini belum memiliki akses perangkat aktif yang bisa dicabut.",
      );
    }

    await connection.execute(
      `
        UPDATE monitoring_devices d
        INNER JOIN monitoring_device_packages p
          ON p.device_id = d.id
        SET d.is_active = FALSE
        WHERE p.request_id = ?
      `,
      [requestId],
    );
    await connection.execute(
      `
        UPDATE monitoring_device_packages
        SET
          package_status = 'revoked',
          revoked_at = COALESCE(revoked_at, ?)
        WHERE request_id = ?
          AND package_status <> 'revoked'
      `,
      [formatMysqlDateTime(new Date()), requestId],
    );
    await connection.execute(
      `
        UPDATE monitoring_device_requests
        SET status = 'revoked'
        WHERE id = ?
      `,
      [requestId],
    );

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: "device_provisioning_revoked",
      metadata: {
        deviceCode: request.deviceCode,
        requestCode: request.requestCode,
      },
      requestId,
    });

    const updatedRequest = await findDeviceRequestById({
      connection,
      requestId,
    });
    await connection.commit();

    return updatedRequest;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function rejectDeviceRequestInMysql({
  adminUserId,
  rejectionReason,
  requestId,
}: {
  adminUserId: string;
  rejectionReason: string;
  requestId: string;
}): Promise<MonitoringDeviceRequest> {
  const cleanReason = normalizeRejectionReason(rejectionReason);

  if (cleanReason.length < 8) {
    throw new Error("Alasan penolakan wajib jelas, minimal 8 karakter.");
  }

  if (cleanReason.length > 1000) {
    throw new Error("Alasan penolakan maksimal 1000 karakter.");
  }

  const pool = getMysqlPool();
  const connection = await pool.getConnection();
  const reviewedAt = new Date();

  try {
    await connection.beginTransaction();
    const request = await findDeviceRequestForUpdate({ connection, requestId });

    if (request.status !== "pending_admin_review") {
      throw new Error("Pengajuan device ini sudah diproses sebelumnya.");
    }

    await connection.execute(
      `
        UPDATE monitoring_device_requests
        SET
          status = 'rejected',
          admin_reviewed_by_user_id = ?,
          admin_reviewed_at = ?,
          rejection_reason = ?
        WHERE id = ?
      `,
      [adminUserId, formatMysqlDateTime(reviewedAt), cleanReason, requestId],
    );

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: "device_request_rejected",
      metadata: {
        deviceCode: request.deviceCode,
        requestCode: request.requestCode,
        reasonLength: cleanReason.length,
      },
      requestId,
    });

    const updatedRequest = await findDeviceRequestById({
      connection,
      requestId,
    });
    await connection.commit();

    return updatedRequest;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
