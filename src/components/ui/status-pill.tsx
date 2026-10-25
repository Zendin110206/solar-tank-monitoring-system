import type { ReactNode } from "react";

// Lencana status berbentuk pil dengan titik warna di depan label.
// Warna diambil dari peta warna status (status-tone.ts) atau peta milik halaman.
export function StatusPill({
  badgeClass,
  children,
  dotClass,
}: {
  badgeClass: string;
  children: ReactNode;
  dotClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}
    >
      <span className={`size-2 rounded-full ${dotClass}`} />
      {children}
    </span>
  );
}
