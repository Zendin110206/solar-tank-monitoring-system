import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { AuthBrandPanel } from "./auth-brand-panel";
import { AuthBrandRow } from "./auth-brand-row";
import { AUTH_CONTENT } from "./auth-content";

// Kotak keterangan abu-abu di bawah formulir.
export function AuthNote({ lines }: { lines: readonly string[] }) {
  return (
    <div className="mt-[calc(16*var(--auth-u))] flex items-center gap-[calc(18*var(--auth-u))] rounded-[calc(10*var(--auth-u))] bg-brand-mist px-[calc(21*var(--auth-u))] py-[calc(16.5*var(--auth-u))]">
      <Info
        aria-hidden="true"
        className="size-[calc(22*var(--auth-u))] shrink-0 text-brand-ink"
        strokeWidth={1.75}
      />
      <p className="text-[length:max(14px,calc(16*var(--auth-u)))] leading-[calc(23*var(--auth-u))] text-brand-ink">
        {lines.map((line, index) => (
          <span className="block" key={index}>
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

// Kerangka halaman akun: panel formulir di kiri, panel merek di kanan.
// Dipakai halaman masuk, lupa kata sandi, atur ulang kata sandi, dan
// pengajuan akses. `wide` memberi ruang lebih untuk formulir yang panjang.
export function AuthLayout({
  children,
  description,
  heading,
  note,
  wide = false,
}: {
  children: ReactNode;
  description: string;
  heading: string;
  note?: ReactNode;
  wide?: boolean;
}) {
  const columns = wide
    ? "lg:grid-cols-[calc(760*var(--auth-u))_minmax(0,1fr)]"
    : "lg:grid-cols-[calc(600*var(--auth-u))_minmax(0,1fr)]";
  const descriptionWidth = wide
    ? "max-w-[calc(560*var(--auth-u))]"
    : "max-w-[calc(430*var(--auth-u))]";
  const contentWidth = wide
    ? "lg:max-w-[calc(626*var(--auth-u))]"
    : "lg:max-w-[calc(466*var(--auth-u))]";

  return (
    <main
      className={`auth-scale grid min-h-dvh bg-white text-brand-ink ${columns}`}
    >
      <div className="flex min-w-0 flex-col px-6 pb-8 pt-6 sm:px-10 md:mx-auto md:w-full md:max-w-[38rem] md:pt-10 lg:mx-0 lg:max-w-none lg:border-r lg:border-zinc-200 lg:pb-[calc(39*var(--auth-u))] lg:pl-[calc(84*var(--auth-u))] lg:pr-[calc(50*var(--auth-u))] lg:pt-[calc(29*var(--auth-u))]">
        <header className="flex min-h-[calc(102*var(--auth-u))] items-center">
          <AuthBrandRow />
        </header>

        <div
          className={`login-shell-enter mt-[calc(60*var(--auth-u))] w-full ${contentWidth}`}
        >
          <h1 className="text-[length:calc(46*var(--auth-u))] font-bold leading-[1.15] tracking-[-0.01em] text-brand-ink">
            {heading}
          </h1>
          <p
            className={`mt-[calc(10*var(--auth-u))] ${descriptionWidth} text-[length:calc(20*var(--auth-u))] leading-[calc(31*var(--auth-u))] text-brand-ink/90`}
          >
            {description}
          </p>

          {children}

          {note}
        </div>

        <footer className="mt-auto pr-[4.5rem] pt-[calc(36*var(--auth-u))] text-[length:max(13px,calc(14.5*var(--auth-u)))] leading-[calc(23*var(--auth-u))] text-brand-muted md:pr-0">
          <p>
            {AUTH_CONTENT.copyright[0]}
            <br />
            {AUTH_CONTENT.copyright[1]}
          </p>
        </footer>
      </div>

      <AuthBrandPanel />
    </main>
  );
}
