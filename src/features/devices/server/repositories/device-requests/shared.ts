import "server-only";

export function formatMysqlDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (!Number.isFinite(time)) {
    throw new Error("Timestamp pengajuan device tidak valid.");
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
