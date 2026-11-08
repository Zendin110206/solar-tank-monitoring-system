// Pembantu angka umum yang dipakai komponen tampilan (grafik, peta, visual 3D).

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
