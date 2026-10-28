// Hitungan hari tampilan (zona Jakarta, UTC+7) untuk grafik dan ekspor riwayat.

export const DAY_MS = 24 * 60 * 60 * 1000;

export const DISPLAY_TIME_ZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

export function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfDisplayDay(time: number) {
  const date = new Date(time + DISPLAY_TIME_ZONE_OFFSET_MS);
  date.setUTCHours(0, 0, 0, 0);

  return new Date(date.getTime() - DISPLAY_TIME_ZONE_OFFSET_MS);
}
