import Image from "next/image";
import Link from "next/link";

import { AUTH_CONTENT } from "./auth-content";

const { brand } = AUTH_CONTENT;

// Logo Telkom Indonesia dan Infranexia; seluruh baris kembali ke beranda.
export function AuthBrandRow() {
  return (
    <Link
      aria-label={brand.homeLabel}
      className="inline-flex w-fit max-w-full items-center gap-[calc(18*var(--auth-u))] max-sm:gap-3 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/25"
      href="/"
    >
      <Image
        alt={brand.telkomAlt}
        className="h-[calc(58*var(--auth-u))] w-auto max-sm:h-10"
        height={346}
        loading="eager"
        src="/brand/telkom-indonesia.svg"
        width={1405}
      />
      <span
        aria-hidden="true"
        className="h-[calc(64*var(--auth-u))] w-px max-sm:h-11 shrink-0 bg-zinc-300"
      />
      <Image
        alt={brand.infranexiaAlt}
        className="h-[calc(52*var(--auth-u))] w-auto max-sm:h-9"
        height={185}
        loading="eager"
        src="/brand/infranexia.png"
        width={640}
      />
    </Link>
  );
}
