import "server-only";

import { getMysqlPool } from "../../../../../lib/database/mysql-connection";
import type {
  MonitoringFirmwareTemplate,
  MonitoringHardwareProfile,
} from "../../../types/monitoring";
import { rowToFirmwareTemplate, rowToHardwareProfile } from "./row-mappers";
import type { FirmwareTemplateRow, HardwareProfileRow } from "./types";
import type { PoolConnection } from "mysql2/promise";

export async function findHardwareProfileById({
  connection,
  hardwareProfileId,
}: {
  connection: PoolConnection;
  hardwareProfileId: string;
}): Promise<MonitoringHardwareProfile> {
  const [rows] = await connection.execute<HardwareProfileRow[]>(
    `
      SELECT
        id,
        code,
        name,
        board_family,
        board_label,
        sensor_type,
        trigger_pin,
        echo_pin,
        supported_tank_shape,
        firmware_template_id,
        report_interval_ms,
        is_active
      FROM monitoring_hardware_profiles
      WHERE id = ?
      LIMIT 1
    `,
    [hardwareProfileId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Hardware profile pengajuan tidak ditemukan.");
  }

  return rowToHardwareProfile(row);
}

export async function findFirmwareTemplateById({
  connection,
  firmwareTemplateId,
}: {
  connection: PoolConnection;
  firmwareTemplateId: string;
}): Promise<MonitoringFirmwareTemplate> {
  const [rows] = await connection.execute<FirmwareTemplateRow[]>(
    `
      SELECT
        id,
        template_key,
        version,
        display_name,
        source_path,
        checksum_sha256,
        is_active
      FROM monitoring_firmware_templates
      WHERE id = ?
      LIMIT 1
    `,
    [firmwareTemplateId],
  );
  const row = rows[0];

  if (!row) {
    throw new Error("Template firmware pengajuan tidak ditemukan.");
  }

  return rowToFirmwareTemplate(row);
}

export async function listFirmwareTemplatesFromMysql({
  activeOnly = false,
}: {
  activeOnly?: boolean;
} = {}): Promise<MonitoringFirmwareTemplate[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<FirmwareTemplateRow[]>(
    `
      SELECT
        id,
        template_key,
        version,
        display_name,
        source_path,
        checksum_sha256,
        is_active
      FROM monitoring_firmware_templates
      ${activeOnly ? "WHERE is_active = TRUE" : ""}
      ORDER BY template_key ASC, version DESC
    `,
  );

  return rows.map(rowToFirmwareTemplate);
}

export async function listHardwareProfilesFromMysql({
  activeOnly = false,
}: {
  activeOnly?: boolean;
} = {}): Promise<MonitoringHardwareProfile[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<HardwareProfileRow[]>(
    `
      SELECT
        hp.id,
        hp.code,
        hp.name,
        hp.board_family,
        hp.board_label,
        hp.sensor_type,
        hp.trigger_pin,
        hp.echo_pin,
        hp.supported_tank_shape,
        hp.firmware_template_id,
        hp.report_interval_ms,
        hp.is_active
      FROM monitoring_hardware_profiles hp
      INNER JOIN monitoring_firmware_templates ft
        ON ft.id = hp.firmware_template_id
      ${activeOnly ? "WHERE hp.is_active = TRUE AND ft.is_active = TRUE" : ""}
      ORDER BY hp.name ASC
    `,
  );

  return rows.map(rowToHardwareProfile);
}
