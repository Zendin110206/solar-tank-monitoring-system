// Format angka dan waktu untuk teks yang dilihat pengguna (bahasa Indonesia, zona Jakarta).
// Dipakai halaman, komponen, email, dan pesan Telegram supaya cara menulis angka dan
// tanggal sama di semua tempat. Modul ini murni (tanpa I/O), aman dipakai di browser.

const LOCALE = "id-ID";
export const DISPLAY_TIME_ZONE = "Asia/Jakarta";

// Angka gaya Indonesia (titik ribuan, koma desimal). Tanpa maximumFractionDigits,
// bawaan Intl dipakai: paling banyak 3 angka desimal.
export function formatNumber(
  value: number,
  maximumFractionDigits?: number,
): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

// Tanggal dan jam Jakarta, contoh "25 Okt 2026, 22.06".
export function formatDateTimeJakarta(value: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatRuntimeHour(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, 2)} jam`;
}

export function formatDateTimeOrDash(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return formatDateTimeJakarta(value);
}
