import "server-only";

import {
  getDevicePackageMaxDownloads,
  hashDownloadToken,
} from "../../../lib/firmware-package";
import type { MonitoringFirmwarePackage } from "../../../types/monitoring";
import { rowToFirmwarePackage } from "./row-mappers";
import { formatMysqlDateTime } from "./shared";
import type { FirmwarePackageRow } from "./types";
import type { PoolConnection } from "mysql2/promise";
import { randomBytes } from "node:crypto";

export async function findPackageForUpdateByToken({
  connection,
  downloadToken,
}: {
  connection: PoolConnection;
  downloadToken: string;
}): Promise<FirmwarePackageRow | null> {
  const [rows] = await connection.execute<FirmwarePackageRow[]>(
    `
      SELECT *
      FROM monitoring_device_packages
      WHERE download_token_hash = ?
      LIMIT 1
      FOR UPDATE
    `,
    [hashDownloadToken(downloadToken)],
  );

  return rows[0] ?? null;
}

export async function findLatestPackageForRequestForUpdate({
  connection,
  requestId,
}: {
  connection: PoolConnection;
  requestId: string;
}): Promise<FirmwarePackageRow | null> {
  const [rows] = await connection.execute<FirmwarePackageRow[]>(
    `
      SELECT *
      FROM monitoring_device_packages
      WHERE request_id = ?
      ORDER BY generated_at DESC, id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [requestId],
  );

  return rows[0] ?? null;
}

export async function findPackageById({
  connection,
  packageId,
}: {
  connection: PoolConnection;
  packageId: string;
}): Promise<MonitoringFirmwarePackage> {
  const [rows] = await connection.execute<FirmwarePackageRow[]>(
    `
      SELECT *
      FROM monitoring_device_packages
      WHERE id = ?
      LIMIT 1
    `,
    [packageId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Paket firmware tidak ditemukan setelah diperbarui.");
  }

  return rowToFirmwarePackage(row);
}

export async function insertFirmwarePackage({
  connection,
  deviceId,
  deviceKeyHash,
  downloadExpiresAt,
  downloadToken,
  encryptedPackage,
  firmwareTemplateId,
  generatedAt,
  hardwareProfileId,
  packageChecksumSha256,
  packageFilename,
  packageSizeBytes,
  requestId,
}: {
  connection: PoolConnection;
  deviceId: string;
  deviceKeyHash: string;
  downloadExpiresAt: Date;
  downloadToken: string;
  encryptedPackage: {
    authTag: Buffer;
    ciphertext: Buffer;
    iv: Buffer;
  };
  firmwareTemplateId: string;
  generatedAt: Date;
  hardwareProfileId: string;
  packageChecksumSha256: string;
  packageFilename: string;
  packageSizeBytes: number;
  requestId: string;
}): Promise<MonitoringFirmwarePackage> {
  const packageId = `device_package_${randomBytes(18).toString("base64url")}`;
  const maxDownloadCount = getDevicePackageMaxDownloads();

  await connection.execute(
    `
      INSERT INTO monitoring_device_packages (
        id,
        request_id,
        device_id,
        package_status,
        device_key_hash,
        download_token_hash,
        download_expires_at,
        download_count,
        max_download_count,
        package_filename,
        package_size_bytes,
        package_checksum_sha256,
        package_ciphertext,
        package_iv,
        package_auth_tag,
        content_type,
        firmware_template_id,
        hardware_profile_id,
        generated_at
      )
      VALUES (?, ?, ?, 'ready', ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'application/zip', ?, ?, ?)
    `,
    [
      packageId,
      requestId,
      deviceId,
      deviceKeyHash,
      hashDownloadToken(downloadToken),
      formatMysqlDateTime(downloadExpiresAt),
      maxDownloadCount,
      packageFilename,
      packageSizeBytes,
      packageChecksumSha256,
      encryptedPackage.ciphertext,
      encryptedPackage.iv,
      encryptedPackage.authTag,
      firmwareTemplateId,
      hardwareProfileId,
      formatMysqlDateTime(generatedAt),
    ],
  );

  const [rows] = await connection.execute<FirmwarePackageRow[]>(
    `
      SELECT *
      FROM monitoring_device_packages
      WHERE id = ?
      LIMIT 1
    `,
    [packageId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Paket firmware gagal dibaca setelah dibuat.");
  }

  return rowToFirmwarePackage(row);
}
