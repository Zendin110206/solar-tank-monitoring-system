import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  AUTH_TEXT_LINK_CLASS,
  AUTH_TEXT_LINK_ICON_CLASS,
} from "./auth-form-classes";

// Tautan teks merah dengan ikon kecil di bawah tombol formulir.
export function AuthTextLink({
  children,
  href,
  icon: Icon,
}: {
  children: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link className={AUTH_TEXT_LINK_CLASS} href={href}>
      <Icon
        aria-hidden="true"
        className={AUTH_TEXT_LINK_ICON_CLASS}
        strokeWidth={2.25}
      />
      {children}
    </Link>
  );
}

// Kelompok tautan teks, ditumpuk ke bawah.
export function AuthTextLinks({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[calc(6*var(--auth-u))] flex flex-col items-start">
      {children}
    </div>
  );
}
