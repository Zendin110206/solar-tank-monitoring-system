import type { ReactNode } from "react";

import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";

export type DashboardPageNavItem = {
  href: `#${string}`;
  label: string;
};

// Bilah atas halaman: tautan lompat ke bagian di halaman yang sama (kiri)
// dan kontrol khusus halaman, misalnya pembaruan otomatis (kanan).
export function DashboardPageNav({
  controls,
  items,
}: {
  controls?: ReactNode;
  items: readonly DashboardPageNavItem[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label={DASHBOARD_SHELL_CONTENT.pageNavigationLabel}>
        <ul className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <li key={item.href}>
              <a
                className="inline-flex min-h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-brand-crimson/40 hover:text-brand-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson"
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {controls ? (
        <div className="flex flex-wrap items-center gap-3">{controls}</div>
      ) : null}
    </div>
  );
}
