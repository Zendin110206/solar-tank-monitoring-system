import type { ReactNode } from "react";

// Pesan kesalahan formulir (kotak merah lembut) di atas tombol kirim.
export const FORM_ERROR_CLASS =
  "rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800";

export function FormErrorMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        className ? `${className} ${FORM_ERROR_CLASS}` : FORM_ERROR_CLASS
      }
    >
      {children}
    </div>
  );
}

// Hasil aksi singkat di dalam dialog: merah untuk gagal, hijau untuk berhasil.
const ACTION_MESSAGE_CLASS = {
  danger:
    "rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700",
  success:
    "rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700",
} as const;

export function ActionMessage({
  children,
  tone,
}: {
  children: ReactNode;
  tone: keyof typeof ACTION_MESSAGE_CLASS;
}) {
  return <p className={ACTION_MESSAGE_CLASS[tone]}>{children}</p>;
}
