import "server-only";

import {
  createDownloadExpiresAt,
  createDownloadToken,
  decryptFirmwarePackage,
  getDevicePackageMaxDownloads,
  hashDownloadToken,
} from "../../../lib/firmware-package";
import { getMysqlPool } from "../../../../../lib/database/mysql-connection";
import { insertProvisioningEvent } from "./events";
import { createPackageForRequest } from "./package-generation";
import {
  findLatestPackageForRequestForUpdate,
  findPackageById,
  findPackageForUpdateByToken,
} from "./package-queries";
import { findDeviceRequestById, findDeviceRequestForUpdate } from "./requests";
import { rowToFirmwarePackage } from "./row-mappers";
import { formatMysqlDateTime } from "./shared";
import type {
  DevicePackageAdminMutationResult,
  DownloadDevicePackageResult,
} from "./types";

export async function recordFirmwarePackageEmailDeliveryInMysql({
  adminUserId,
  delivered,
  delivery,
  errorReason,
  packageId,
  requestId,
}: {
  adminUserId: string;
  delivered: boolean;
  delivery: string;
  errorReason?: string;
  packageId: string;
  requestId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (delivered) {
      await connection.execute(
        `
          UPDATE monitoring_device_requests
          SET status = 'waiting_firmware_download'
          WHERE id = ?
            AND status = 'approved_package_ready'
        `,
        [requestId],
      );
    }

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: delivered
        ? "firmware_package_email_delivered"
        : "firmware_package_email_failed",
      metadata: {
        delivery,
        ...(errorReason ? { errorReason } : {}),
      },
      packageId,
      requestId,
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function refreshDevicePackageDownloadTokenInMysql({
  adminUserId,
  requestId,
}: {
  adminUserId: string;
  requestId: string;
}): Promise<DevicePackageAdminMutationResult> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const request = await findDeviceRequestForUpdate({ connection, requestId });

    if (
      request.status !== "approved_package_ready" &&
      request.status !== "waiting_firmware_download" &&
      request.status !== "waiting_first_valid_ping"
    ) {
      throw new Error(
        "Link firmware hanya bisa dikirim ulang untuk perangkat yang paketnya sudah dibuat dan belum aktif.",
      );
    }

    const packageRow = await findLatestPackageForRequestForUpdate({
      connection,
      requestId,
    });

    if (!packageRow) {
      throw new Error("Paket firmware belum tersedia untuk pengajuan ini.");
    }

    const devicePackage = rowToFirmwarePackage(packageRow);

    if (
      devicePackage.packageStatus === "revoked" ||
      devicePackage.packageStatus === "expired" ||
      devicePackage.packageStatus === "failed" ||
      devicePackage.packageStatus === "activated"
    ) {
      throw new Error(
        "Paket firmware ini tidak bisa dikirim ulang. Buat ulang paket jika masih diperlukan.",
      );
    }

    const downloadToken = createDownloadToken();
    const downloadExpiresAt = createDownloadExpiresAt(new Date());

    await connection.execute(
      `
        UPDATE monitoring_device_packages
        SET
          download_token_hash = ?,
          download_expires_at = ?,
          download_count = 0,
          max_download_count = ?,
          package_status = CASE
            WHEN package_status = 'downloaded' THEN 'downloaded'
            ELSE 'ready'
          END
        WHERE id = ?
      `,
      [
        hashDownloadToken(downloadToken),
        formatMysqlDateTime(downloadExpiresAt),
        getDevicePackageMaxDownloads(),
        devicePackage.id,
      ],
    );

    if (request.status === "approved_package_ready") {
      await connection.execute(
        `
          UPDATE monitoring_device_requests
          SET status = 'waiting_firmware_download'
          WHERE id = ?
        `,
        [requestId],
      );
    }

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: "firmware_package_download_link_refreshed",
      metadata: {
        deviceCode: request.deviceCode,
        requestCode: request.requestCode,
      },
      packageId: devicePackage.id,
      requestId,
    });

    const updatedPackage = await findPackageById({
      connection,
      packageId: devicePackage.id,
    });
    const updatedRequest = await findDeviceRequestById({
      connection,
      requestId,
    });
    await connection.commit();

    return {
      downloadExpiresAt: downloadExpiresAt.toISOString(),
      downloadToken,
      package: updatedPackage,
      request: updatedRequest,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reissueDevicePackageInMysql({
  adminUserId,
  appBaseUrl,
  requestId,
}: {
  adminUserId: string;
  appBaseUrl: string;
  requestId: string;
}): Promise<DevicePackageAdminMutationResult> {
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
        "Paket firmware hanya bisa dibuat ulang setelah pengajuan disetujui.",
      );
    }

    if (request.status === "active") {
      throw new Error(
        "Perangkat yang sudah aktif tidak dibuat ulang otomatis dari sini. Cabut akses dulu jika key perlu diganti.",
      );
    }

    await connection.execute(
      `
        UPDATE monitoring_device_packages
        SET
          package_status = 'revoked',
          revoked_at = COALESCE(revoked_at, ?)
        WHERE request_id = ?
          AND package_status IN ('ready', 'downloaded', 'expired', 'failed')
      `,
      [formatMysqlDateTime(new Date()), requestId],
    );

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
          admin_reviewed_at = COALESCE(admin_reviewed_at, ?)
        WHERE id = ?
      `,
      [adminUserId, formatMysqlDateTime(new Date()), requestId],
    );

    await insertProvisioningEvent({
      actorUserId: adminUserId,
      connection,
      eventType: "firmware_package_reissued",
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
      ...packageResult,
      request: updatedRequest,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function downloadDevicePackageByTokenFromMysql(
  downloadToken: string,
): Promise<DownloadDevicePackageResult> {
  const cleanToken = downloadToken.trim();

  if (!cleanToken.startsWith("dpt_")) {
    return {
      ok: false,
      status: 400,
      message: "Token download tidak valid.",
    };
  }

  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const packageRow = await findPackageForUpdateByToken({
      connection,
      downloadToken: cleanToken,
    });

    if (!packageRow) {
      await connection.rollback();
      return {
        ok: false,
        status: 404,
        message: "Paket firmware tidak ditemukan.",
      };
    }

    const devicePackage = rowToFirmwarePackage(packageRow);
    const now = Date.now();
    const expiresAt = new Date(devicePackage.downloadExpiresAt).getTime();

    if (
      devicePackage.packageStatus === "revoked" ||
      devicePackage.packageStatus === "expired"
    ) {
      await connection.rollback();
      return {
        ok: false,
        status: 410,
        message: "Link download firmware sudah tidak berlaku.",
      };
    }

    if (!Number.isFinite(expiresAt) || expiresAt < now) {
      await connection.execute(
        `
          UPDATE monitoring_device_packages
          SET package_status = 'expired'
          WHERE id = ?
        `,
        [devicePackage.id],
      );
      await insertProvisioningEvent({
        connection,
        eventType: "firmware_package_download_expired",
        packageId: devicePackage.id,
        requestId: devicePackage.requestId,
      });
      await connection.commit();

      return {
        ok: false,
        status: 410,
        message: "Link download firmware sudah kedaluwarsa.",
      };
    }

    if (devicePackage.downloadCount >= devicePackage.maxDownloadCount) {
      await connection.rollback();
      return {
        ok: false,
        status: 429,
        message: "Batas download paket firmware sudah habis.",
      };
    }

    if (
      !Buffer.isBuffer(packageRow.package_ciphertext) ||
      !Buffer.isBuffer(packageRow.package_iv) ||
      !Buffer.isBuffer(packageRow.package_auth_tag) ||
      packageRow.package_ciphertext.length === 0 ||
      packageRow.package_iv.length === 0 ||
      packageRow.package_auth_tag.length === 0
    ) {
      await connection.execute(
        `
          UPDATE monitoring_device_packages
          SET package_status = 'failed'
          WHERE id = ?
        `,
        [devicePackage.id],
      );
      await insertProvisioningEvent({
        connection,
        eventType: "firmware_package_missing_content",
        packageId: devicePackage.id,
        requestId: devicePackage.requestId,
      });
      await connection.commit();

      return {
        ok: false,
        status: 410,
        message:
          "Paket firmware lama belum memiliki file ZIP. Admin perlu membuat pengajuan baru agar paket firmware bisa diunduh.",
      };
    }

    let zipBuffer: Buffer;

    try {
      zipBuffer = decryptFirmwarePackage({
        authTag: packageRow.package_auth_tag,
        ciphertext: packageRow.package_ciphertext,
        iv: packageRow.package_iv,
      });
    } catch {
      await insertProvisioningEvent({
        connection,
        eventType: "firmware_package_decrypt_failed",
        packageId: devicePackage.id,
        requestId: devicePackage.requestId,
      });
      await connection.commit();

      return {
        ok: false,
        status: 500,
        message: "Paket firmware belum bisa dibuka.",
      };
    }

    await connection.execute(
      `
        UPDATE monitoring_device_packages
        SET
          package_status = 'downloaded',
          download_count = download_count + 1,
          first_downloaded_at = COALESCE(first_downloaded_at, ?)
        WHERE id = ?
      `,
      [formatMysqlDateTime(new Date()), devicePackage.id],
    );
    await connection.execute(
      `
        UPDATE monitoring_device_requests
        SET status = 'waiting_first_valid_ping'
        WHERE id = ?
          AND status IN ('approved_package_ready', 'waiting_firmware_download')
      `,
      [devicePackage.requestId],
    );
    await insertProvisioningEvent({
      connection,
      eventType: "firmware_package_downloaded",
      metadata: {
        downloadCount: devicePackage.downloadCount + 1,
        maxDownloadCount: devicePackage.maxDownloadCount,
      },
      packageId: devicePackage.id,
      requestId: devicePackage.requestId,
    });

    await connection.commit();

    return {
      ok: true,
      content: zipBuffer,
      contentType: packageRow.content_type || "application/zip",
      filename: devicePackage.packageFilename,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
