import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  // Ikon di sisi kiri (opsional). Kelas `className` milik pemanggil harus
  // sudah menyediakan ruang kiri untuk ikon ini.
  leadingIcon?: ReactNode;
};

// Pilihan (dropdown) standar. Panah bawaan browser disembunyikan
// (`appearance-none`) dan diganti satu ikon panah dengan posisi tetap:
// 16 px dari tepi kanan, tepat di tengah secara vertikal. Teks pilihan
// selalu menyisakan ruang kanan (`pr-11`) agar tidak menabrak panah. Selama
// pilihan wajib belum diisi, teks petunjuknya abu-abu.
export function SelectField({
  children,
  className = "",
  leadingIcon,
  ...selectProps
}: SelectFieldProps) {
  return (
    <div className="relative">
      {leadingIcon}
      <select
        {...selectProps}
        className={`${className} cursor-pointer appearance-none !pr-11 invalid:text-zinc-500 [&>option]:text-zinc-900`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500"
        strokeWidth={2}
      />
    </div>
  );
}
