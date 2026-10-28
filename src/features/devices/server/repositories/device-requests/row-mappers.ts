import "server-only";

import {
  DEFAULT_REGIONAL_LABEL,
  DEFAULT_WILAYAH_LABEL,
  normalizeRegionalLabel,
  normalizeWilayahLabel,
} from "@/features/monitoring/domain/location-taxonomy";
import type {
  Device,
  DeviceRequestStatus,
  DeviceRequestValidationIssue,
  DeviceSensorType,
  FirmwarePackageStatus,
  HardwareBoardFamily,
  HardwareTankShapeSupport,
  LoadPowerUnit,
  MonitoringDeviceRequest,
  MonitoringFirmwarePackage,
  MonitoringFirmwareTemplate,
  MonitoringHardwareProfile,
  Site,
  Tank,
} from "@/features/monitoring/types/monitoring";
import type {
  DeviceRequestRow,
  FirmwarePackageRow,
  FirmwareTemplateRow,
  HardwareProfileRow,
  PendingDeviceActivationRow,
} from "./types";
import { toBoolean } from "@/lib/database/row-values";
import { toTankShape } from "@/features/monitoring/domain/tank-shape";

const DEVICE_REQUEST_STATUSES: DeviceRequestStatus[] = [
  "pending_admin_review",
  "rejected",
  "approved_waiting_package",
  "approved_package_ready",
  "waiting_firmware_download",
  "waiting_first_valid_ping",
  "active",
  "expired",
  "revoked",
  "package_generation_failed",
];

const FIRMWARE_PACKAGE_STATUSES: FirmwarePackageStatus[] = [
  "ready",
  "downloaded",
  "expired",
  "revoked",
  "activated",
  "failed",
];

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(
  value: number | string | null | undefined,
): number | undefined {
  if (value === null || typeof value === "undefined") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDeviceRequestStatus(value: string): value is DeviceRequestStatus {
  return DEVICE_REQUEST_STATUSES.includes(value as DeviceRequestStatus);
}

function isFirmwarePackageStatus(
  value: string,
): value is FirmwarePackageStatus {
  return FIRMWARE_PACKAGE_STATUSES.includes(value as FirmwarePackageStatus);
}

function toDeviceRequestStatus(value: string): DeviceRequestStatus {
  return isDeviceRequestStatus(value) ? value : "pending_admin_review";
}

function toDeviceSensorType(value: string | undefined): DeviceSensorType {
  return value === "energy" ? "energy" : "fuel";
}

function toLoadPowerUnit(value: string | undefined): LoadPowerUnit {
  return value === "kva" ? "kva" : "kw";
}

export function rowToActivationSite(row: PendingDeviceActivationRow): Site {
  const latitude = toOptionalNumber(row.latitude);
  const longitude = toOptionalNumber(row.longitude);
  const regionalLabel =
    normalizeRegionalLabel(row.regional_label) ?? DEFAULT_REGIONAL_LABEL;
  const wilayahLabel =
    normalizeWilayahLabel(row.wilayah_label) ?? DEFAULT_WILAYAH_LABEL;

  return {
    id: row.site_id,
    code: row.site_code,
    name: row.site_name,
    areaLabel: row.area_label,
    regionalLabel,
    wilayahLabel,
    ...(typeof latitude === "number" ? { latitude } : {}),
    ...(typeof longitude === "number" ? { longitude } : {}),
    isActive: true,
  };
}

export function rowToActivationTank(row: PendingDeviceActivationRow): Tank {
  const diameterCm = toOptionalNumber(row.diameter_cm);
  const lengthCm = toOptionalNumber(row.length_cm);
  const heightCm = toOptionalNumber(row.height_cm);
  const widthCm = toOptionalNumber(row.width_cm);

  return {
    id: row.tank_id,
    siteId: row.tank_site_id,
    name: row.tank_name,
    shape: toTankShape(row.tank_shape),
    capacityLiter: toNumber(row.capacity_liter),
    ...(typeof diameterCm === "number" ? { diameterCm } : {}),
    ...(typeof lengthCm === "number" ? { lengthCm } : {}),
    ...(typeof heightCm === "number" ? { heightCm } : {}),
    ...(typeof widthCm === "number" ? { widthCm } : {}),
    sensorMountHeightCm: toNumber(row.sensor_mount_height_cm),
    lowLevelPercent: toNumber(row.low_level_percent),
    criticalLevelPercent: toNumber(row.critical_level_percent),
    consumptionLiterPerHour: toNumber(row.consumption_liter_per_hour),
    isActive: true,
  };
}

export function rowToActivationDevice(row: PendingDeviceActivationRow): Device {
  return {
    id: row.device_id,
    siteId: row.device_site_id,
    tankId: row.device_tank_id,
    code: row.device_code,
    label: row.device_label,
    expectedReportIntervalSec: toNumber(row.expected_report_interval_sec),
    apiKeyHash: row.device_api_key_hash ?? row.package_device_key_hash,
    isActive: true,
  };
}

function toBoardFamily(value: string): HardwareBoardFamily {
  if (value === "esp8266" || value === "esp32") {
    return value;
  }

  return "unknown";
}

function toTankShapeSupport(value: string): HardwareTankShapeSupport {
  if (
    value === "rectangular" ||
    value === "horizontal-cylinder" ||
    value === "any"
  ) {
    return value;
  }

  return "any";
}

function parseMysqlDateTimeAsUtc(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const cleanValue = value.trim();
  if (!cleanValue) {
    return null;
  }

  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(cleanValue);
  const normalizedValue = cleanValue.includes("T")
    ? cleanValue
    : cleanValue.replace(" ", "T");
  const parsedTime = Date.parse(
    hasExplicitTimezone ? normalizedValue : `${normalizedValue}Z`,
  );

  return Number.isFinite(parsedTime)
    ? new Date(parsedTime).toISOString()
    : null;
}

function parseRequiredMysqlDateTimeAsUtc(value: Date | string): string {
  const isoValue = parseMysqlDateTimeAsUtc(value);

  if (!isoValue) {
    throw new Error("Timestamp pengajuan device dari MySQL tidak valid.");
  }

  return isoValue;
}

function isValidationIssue(
  value: unknown,
): value is DeviceRequestValidationIssue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const issue = value as Partial<DeviceRequestValidationIssue>;

  return (
    typeof issue.field === "string" &&
    typeof issue.message === "string" &&
    (issue.severity === "error" || issue.severity === "warning")
  );
}

function parseValidationWarnings(
  value: unknown,
): DeviceRequestValidationIssue[] {
  let parsedValue = value;

  if (typeof value === "string" && value.trim()) {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue.filter(isValidationIssue);
}

export function rowToFirmwareTemplate(
  row: FirmwareTemplateRow,
): MonitoringFirmwareTemplate {
  return {
    id: row.id,
    templateKey: row.template_key,
    version: row.version,
    displayName: row.display_name,
    sourcePath: row.source_path,
    checksumSha256: row.checksum_sha256,
    isActive: toBoolean(row.is_active),
  };
}

export function rowToHardwareProfile(
  row: HardwareProfileRow,
): MonitoringHardwareProfile {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    boardFamily: toBoardFamily(row.board_family),
    boardLabel: row.board_label,
    sensorType: row.sensor_type,
    triggerPin: row.trigger_pin,
    echoPin: row.echo_pin,
    supportedTankShape: toTankShapeSupport(row.supported_tank_shape),
    firmwareTemplateId: row.firmware_template_id,
    reportIntervalMs: toNumber(row.report_interval_ms),
    isActive: toBoolean(row.is_active),
  };
}

export function rowToDeviceRequest(
  row: DeviceRequestRow,
): MonitoringDeviceRequest {
  const latitude = toOptionalNumber(row.latitude);
  const longitude = toOptionalNumber(row.longitude);
  const lengthCm = toOptionalNumber(row.length_cm);
  const widthCm = toOptionalNumber(row.width_cm);
  const heightCm = toOptionalNumber(row.height_cm);
  const diameterCm = toOptionalNumber(row.diameter_cm);
  const regionalLabel =
    normalizeRegionalLabel(row.regional_label) ?? DEFAULT_REGIONAL_LABEL;
  const wilayahLabel =
    normalizeWilayahLabel(row.wilayah_label) ?? DEFAULT_WILAYAH_LABEL;

  return {
    id: row.id,
    requestCode: row.request_code,
    requesterUserId: row.requester_user_id,
    requesterEmail: row.requester_email,
    status: toDeviceRequestStatus(row.status),
    siteCode: row.site_code,
    siteName: row.site_name,
    areaLabel: row.area_label,
    regionalLabel,
    wilayahLabel,
    ...(typeof latitude === "number" ? { latitude } : {}),
    ...(typeof longitude === "number" ? { longitude } : {}),
    deviceCode: row.device_code,
    deviceLabel: row.device_label,
    deviceSensorType: toDeviceSensorType(row.device_sensor_type),
    tankShape: toTankShape(row.tank_shape),
    capacityLiter: toNumber(row.capacity_liter),
    ...(typeof lengthCm === "number" ? { lengthCm } : {}),
    ...(typeof widthCm === "number" ? { widthCm } : {}),
    ...(typeof heightCm === "number" ? { heightCm } : {}),
    ...(typeof diameterCm === "number" ? { diameterCm } : {}),
    sensorMountHeightCm: toNumber(row.sensor_mount_height_cm),
    loadValue: toNumber(row.load_value),
    loadUnit: toLoadPowerUnit(row.load_unit),
    dieselEngineCapacityKva: toNumber(row.diesel_engine_capacity_kva),
    cosPhi: toNumber(row.cos_phi),
    lowLevelPercent: toNumber(row.low_level_percent),
    criticalLevelPercent: toNumber(row.critical_level_percent),
    consumptionLiterPerHour: toNumber(row.consumption_liter_per_hour),
    hardwareProfileId: row.hardware_profile_id,
    firmwareTemplateId: row.firmware_template_id,
    adminReviewedByUserId: row.admin_reviewed_by_user_id,
    adminReviewedAt: parseMysqlDateTimeAsUtc(row.admin_reviewed_at),
    rejectionReason: row.rejection_reason,
    validationWarnings: parseValidationWarnings(row.validation_warnings_json),
    createdAt: parseRequiredMysqlDateTimeAsUtc(row.created_at),
    updatedAt: parseRequiredMysqlDateTimeAsUtc(row.updated_at),
  };
}

export function rowToFirmwarePackage(
  row: FirmwarePackageRow,
): MonitoringFirmwarePackage {
  return {
    id: row.id,
    requestId: row.request_id,
    deviceId: row.device_id,
    packageStatus: isFirmwarePackageStatus(row.package_status)
      ? row.package_status
      : "failed",
    deviceKeyHash: row.device_key_hash,
    downloadTokenHash: row.download_token_hash,
    downloadExpiresAt: parseRequiredMysqlDateTimeAsUtc(row.download_expires_at),
    downloadCount: toNumber(row.download_count),
    maxDownloadCount: toNumber(row.max_download_count),
    packageFilename: row.package_filename,
    packageSizeBytes: toNumber(row.package_size_bytes),
    packageChecksumSha256: row.package_checksum_sha256,
    firmwareTemplateId: row.firmware_template_id,
    hardwareProfileId: row.hardware_profile_id,
    generatedAt: parseRequiredMysqlDateTimeAsUtc(row.generated_at),
    firstDownloadedAt: parseMysqlDateTimeAsUtc(row.first_downloaded_at),
    activatedAt: parseMysqlDateTimeAsUtc(row.activated_at),
    revokedAt: parseMysqlDateTimeAsUtc(row.revoked_at),
  };
}

export function isPackageStatus(value: string): value is FirmwarePackageStatus {
  return isFirmwarePackageStatus(value);
}
