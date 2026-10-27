import "server-only";

import { createDeviceKey, hashDeviceKey } from "../../device-key";
import {
  createDownloadExpiresAt,
  createDownloadToken,
  createFirmwarePackageBundle,
  encryptFirmwarePackage,
} from "../../firmware-package";
import type { MonitoringDeviceRequest } from "@/features/monitoring/types/monitoring";
import { findFirmwareTemplateById, findHardwareProfileById } from "./catalog";
import { insertFirmwarePackage } from "./package-queries";
import { createInactiveRegistryForApprovedRequest } from "./registry";
import type { DevicePackageAdminMutationResult } from "./types";
import type { PoolConnection } from "mysql2/promise";

export async function createPackageForRequest({
  appBaseUrl,
  connection,
  request,
}: {
  appBaseUrl: string;
  connection: PoolConnection;
  request: MonitoringDeviceRequest;
}): Promise<DevicePackageAdminMutationResult> {
  const hardwareProfile = await findHardwareProfileById({
    connection,
    hardwareProfileId: request.hardwareProfileId,
  });
  const firmwareTemplate = await findFirmwareTemplateById({
    connection,
    firmwareTemplateId: request.firmwareTemplateId,
  });

  if (!hardwareProfile.isActive || !firmwareTemplate.isActive) {
    throw new Error(
      "Hardware profile atau template firmware belum aktif. Aktifkan dulu setelah dikonfirmasi.",
    );
  }

  const deviceKey = createDeviceKey();
  const deviceKeyHash = hashDeviceKey(deviceKey);
  const firmwarePackage = await createFirmwarePackageBundle({
    appBaseUrl,
    deviceKey,
    firmwareTemplate,
    hardwareProfile,
    request,
  });
  const encryptedPackage = encryptFirmwarePackage(firmwarePackage.zipBuffer);
  const downloadToken = createDownloadToken();
  const downloadExpiresAt = createDownloadExpiresAt(
    firmwarePackage.generatedAt,
  );
  const deviceId = await createInactiveRegistryForApprovedRequest({
    connection,
    deviceKeyHash,
    expectedReportIntervalSec: Math.max(
      Math.round(hardwareProfile.reportIntervalMs / 1000),
      5,
    ),
    request,
  });
  const devicePackage = await insertFirmwarePackage({
    connection,
    deviceId,
    deviceKeyHash,
    downloadExpiresAt,
    downloadToken,
    encryptedPackage,
    firmwareTemplateId: request.firmwareTemplateId,
    generatedAt: firmwarePackage.generatedAt,
    hardwareProfileId: request.hardwareProfileId,
    packageChecksumSha256: firmwarePackage.checksumSha256,
    packageFilename: firmwarePackage.filename,
    packageSizeBytes: firmwarePackage.zipBuffer.length,
    requestId: request.id,
  });

  return {
    downloadExpiresAt: downloadExpiresAt.toISOString(),
    downloadToken,
    package: devicePackage,
    request,
  };
}
