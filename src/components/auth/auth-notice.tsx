import type { ReactNode } from "react";

type AuthNoticeTone = "info" | "success" | "warning";

const TONE_CLASS: Record<AuthNoticeTone, string> = {
  info: "border-blue-100 bg-blue-50 text-blue-800",
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
};

const BOX_CLASS =
  "mt-[calc(20*var(--auth-u))] rounded-lg border px-4 py-3 text-sm leading-6";

// Pemberitahuan formulir. Selalu dirender agar pembaca layar mengumumkan
// isinya saat berubah (aria-live).
export function AuthNotice({
  children,
  tone = "info",
}: {
  children?: ReactNode;
  tone?: AuthNoticeTone;
}) {
  return (
    <div aria-live="polite">
      {children ? (
        <p className={`${BOX_CLASS} ${TONE_CLASS[tone]}`}>{children}</p>
      ) : null}
    </div>
  );
}

// Pesan galat formulir, diumumkan langsung dan dihubungkan ke input lewat
// `aria-describedby` memakai `id` yang sama.
export function AuthError({
  children,
  id,
}: {
  children: ReactNode;
  id: string;
}) {
  return (
    <p
      className={`${BOX_CLASS} border-red-100 bg-red-50 text-red-800`}
      id={id}
      role="alert"
    >
      {children}
    </p>
  );
}
