// Peta warna status yang dipakai bersama di seluruh tampilan FTM.
// - success: aman / online / disetujui      (hijau)
// - warning: perlu perhatian / terlambat     (kuning)
// - danger:  kritis / offline / ditolak      (merah)
// - neutral: belum ada data / tidak aktif    (abu-abu)
// - info:    informasi / sedang diproses     (biru)

// Lencana (badge) berlatar lembut dengan teks dan garis tepi senada.
export const STATUS_BADGE_CLASS = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-red-50 text-red-700 ring-red-100",
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
} as const;

// Titik, garis, atau batang berwarna penuh untuk penanda status.
export const STATUS_DOT_CLASS = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
} as const;

export type StatusTone = keyof typeof STATUS_BADGE_CLASS;
