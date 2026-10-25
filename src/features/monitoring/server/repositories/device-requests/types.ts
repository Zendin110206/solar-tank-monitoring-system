import "server-only";

import type {
  Device,
  DeviceRequestValidationIssue,
  MonitoringDeviceRequest,
  MonitoringFirmwarePackage,
  Site,
  Tank,
} from "../../../types/monitoring";
import type { RowDataPacket } from "mysql2/promise";

export type FirmwareTemplateRow = RowDataPacket & {
  id: string;
  template_key: string;
  version: string;
  display_name: string;
  source_path: string;
  checksum_sha256: string | null;
  is_active: number | boolean;
};

export type HardwareProfileRow = RowDataPacket & {
  id: string;
  code: string;
  name: string;
  board_family: string;
  board_label: string;
  sensor_type: string;
  trigger_pin: string;
  echo_pin: string;
  supported_tank_shape: string;
  firmware_template_id: string;
  report_interval_ms: number | string;
  is_active: number | boolean;
};

export type DeviceRequestRow = RowDataPacket & {
  id: string;
  request_code: string;
  requester_user_id: string;
  requester_email: string;
  status: string;
  site_code: string;
  site_name: string;
  area_label: string;
  regional_label: string | null;
  wilayah_label: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  device_code: string;
  device_label: string;
  device_sensor_type: string;
  tank_shape: string;
  capacity_liter: number | string;
  length_cm: number | string | null;
  width_cm: number | string | null;
  height_cm: number | string | null;
  diameter_cm: number | string | null;
  sensor_mount_height_cm: number | string;
  load_value: number | string | null;
  load_unit: string;
  diesel_engine_capacity_kva: number | string | null;
  cos_phi: number | string | null;
  low_level_percent: number | string;
  critical_level_percent: number | string;
  consumption_liter_per_hour: number | string;
  hardware_profile_id: string;
  firmware_template_id: string;
  admin_reviewed_by_user_id: string | null;
  admin_reviewed_at: Date | string | null;
  rejection_reason: string | null;
  validation_warnings_json: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

export type FirmwarePackageRow = RowDataPacket & {
  id: string;
  request_id: string;
  device_id: string | null;
  package_status: string;
  device_key_hash: string;
  download_token_hash: string;
  download_expires_at: Date | string;
  download_count: number | string;
  max_download_count: number | string;
  package_filename: string;
  package_size_bytes: number | string;
  package_checksum_sha256: string | null;
  package_ciphertext: Buffer | null;
  package_iv: Buffer | null;
  package_auth_tag: Buffer | null;
  content_type: string;
  firmware_template_id: string;
  hardware_profile_id: string;
  generated_at: Date | string;
  first_downloaded_at: Date | string | null;
  activated_at: Date | string | null;
  revoked_at: Date | string | null;
};

export type SiteIdRow = RowDataPacket & {
  id: string;
};

export type ExistingDeviceRow = RowDataPacket & {
  id: string;
};

export type ExistingDeviceRequestRow = RowDataPacket & {
  id: string;
  request_code: string;
  status: string;
};

export type PendingDeviceActivationRow = RowDataPacket & {
  device_id: string;
  device_site_id: string;
  device_tank_id: string;
  device_code: string;
  device_label: string;
  expected_report_interval_sec: number | string;
  device_api_key_hash: string | null;
  device_is_active: number | boolean;
  site_id: string;
  site_code: string;
  site_name: string;
  area_label: string;
  regional_label: string | null;
  wilayah_label: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  site_is_active: number | boolean;
  tank_id: string;
  tank_site_id: string;
  tank_name: string;
  tank_shape: string;
  capacity_liter: number | string;
  diameter_cm: number | string | null;
  length_cm: number | string | null;
  height_cm: number | string | null;
  width_cm: number | string | null;
  sensor_mount_height_cm: number | string;
  low_level_percent: number | string;
  critical_level_percent: number | string;
  consumption_liter_per_hour: number | string;
  tank_is_active: number | boolean;
  package_id: string;
  package_status: string;
  package_device_key_hash: string;
  request_id: string;
  request_status: string;
};

export type CreateDeviceRequestFromMysqlResult =
  | {
      ok: true;
      request: MonitoringDeviceRequest;
      warnings: DeviceRequestValidationIssue[];
    }
  | {
      ok: false;
      issues: DeviceRequestValidationIssue[];
      message: string;
    };

export type ApprovedDeviceRequestPackageResult = {
  downloadExpiresAt: string;
  downloadToken: string;
  package: MonitoringFirmwarePackage;
  request: MonitoringDeviceRequest;
};

export type DownloadDevicePackageResult =
  | {
      ok: true;
      content: Buffer;
      contentType: string;
      filename: string;
    }
  | {
      ok: false;
      status: 400 | 404 | 410 | 429 | 500;
      message: string;
    };

export type DevicePackageAdminMutationResult = {
  downloadExpiresAt: string;
  downloadToken: string;
  package: MonitoringFirmwarePackage;
  request: MonitoringDeviceRequest;
};

export type ActivateApprovedDeviceResult =
  | {
      ok: true;
      device: Device;
      site: Site;
      tank: Tank;
    }
  | {
      ok: false;
      reason: "not-found" | "invalid-key" | "not-ready" | "revoked";
    };
