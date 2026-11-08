import "server-only";

// Mengenali error "kolom belum ada" saat migrasi pengajuan perangkat belum dijalankan.

const DEVICE_REQUEST_SCHEMA_COLUMNS = [
  "device_sensor_type",
  "regional_label",
  "wilayah_label",
  "load_value",
  "load_unit",
  "diesel_engine_capacity_kva",
  "cos_phi",
] as const;

export function isDeviceRequestSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("unknown column") &&
    DEVICE_REQUEST_SCHEMA_COLUMNS.some((columnName) =>
      message.includes(columnName),
    )
  );
}
