// Gaya bersama formulir halaman akun. Ukuran memakai skala `--auth-u`
// dari kelas `.auth-scale` (lihat `src/app/globals.css`).

export const AUTH_LABEL_CLASS =
  "mb-[calc(11*var(--auth-u))] block text-[length:max(14px,calc(18*var(--auth-u)))] font-semibold leading-tight text-brand-ink";

export const AUTH_FIELD_ICON_CLASS =
  "pointer-events-none absolute left-[calc(20*var(--auth-u))] top-1/2 size-[calc(21*var(--auth-u))] -translate-y-1/2 text-zinc-500";

export const AUTH_INPUT_CLASS =
  "h-[max(44px,calc(58*var(--auth-u)))] w-full rounded-[calc(8*var(--auth-u))] border border-brand-line bg-white pl-[calc(60*var(--auth-u))] pr-[calc(20*var(--auth-u))] text-[length:max(16px,calc(18*var(--auth-u)))] text-brand-ink outline-none transition placeholder:text-zinc-500 hover:border-zinc-600 focus:border-brand-red focus:ring-4 focus:ring-brand-red/15 disabled:bg-zinc-50 aria-invalid:border-brand-red";

// Input tanpa ikon di kiri (pilihan dan teks panjang).
export const AUTH_PLAIN_INPUT_CLASS =
  "w-full rounded-[calc(8*var(--auth-u))] border border-brand-line bg-white px-[calc(20*var(--auth-u))] text-[length:max(16px,calc(18*var(--auth-u)))] text-brand-ink outline-none transition placeholder:text-zinc-500 hover:border-zinc-600 focus:border-brand-red focus:ring-4 focus:ring-brand-red/15 disabled:bg-zinc-50";

export const AUTH_HINT_CLASS =
  "mt-[calc(8*var(--auth-u))] text-[length:max(13px,calc(14.5*var(--auth-u)))] leading-snug text-brand-muted";

export const AUTH_SUBMIT_SIZE_CLASS =
  "h-[max(44px,calc(58*var(--auth-u)))] text-[length:max(16px,calc(20*var(--auth-u)))]";

export const AUTH_TEXT_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-[calc(10*var(--auth-u))] rounded-md text-[length:max(15px,calc(18*var(--auth-u)))] font-semibold text-brand-red transition hover:text-brand-red-strong hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/25";

export const AUTH_TEXT_LINK_ICON_CLASS = "size-[calc(17*var(--auth-u))]";
