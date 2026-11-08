// Mengubah nilai kolom MySQL menjadi tipe JavaScript; dipakai repositori.

export function toNumber(value: number | string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}
