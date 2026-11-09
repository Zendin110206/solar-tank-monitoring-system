"use client";

import Link from "next/link";
import { Bell, ChevronRight, Construction, Send } from "lucide-react";
import { useId } from "react";

import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";
import { useDashboardPopover } from "./use-dashboard-popover";

const copy = DASHBOARD_SHELL_CONTENT.notifications;

// Lonceng notifikasi. Pusat notifikasi belum dibangun, jadi panel hanya
// menampilkan pemberitahuan yang benar-benar diketahui saat ini (Telegram
// belum terhubung) dan menjelaskan bahwa fitur lengkapnya sedang dikembangkan.
export function DashboardNotifications({
  needsTelegramBinding,
}: {
  needsTelegramBinding: boolean;
}) {
  const panelId = useId();
  const { close, isOpen, rootRef, toggle, triggerRef } = useDashboardPopover();
  const count = needsTelegramBinding ? 1 : 0;

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={count > 0 ? copy.openWithAlert : copy.open}
        className="relative grid size-11 place-items-center rounded-full text-brand-navy-deep transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40 aria-expanded:bg-zinc-100"
        onClick={toggle}
        ref={triggerRef}
        title={copy.title}
        type="button"
      >
        <Bell
          aria-hidden="true"
          className="size-5 sm:size-[1.4rem]"
          strokeWidth={1.75}
        />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-brand-crimson px-1 text-[0.62rem] font-bold leading-[1.1rem] text-white ring-2 ring-white"
          >
            {count}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          aria-label={copy.title}
          className="dashboard-pop fixed inset-x-3 top-[calc(var(--dashboard-header-height)+0.5rem)] z-50 rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[22rem]"
          id={panelId}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
            <h2 className="text-sm font-semibold text-brand-ink">
              {copy.title}
            </h2>
            {count > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-brand-crimson">
                {count} {copy.newLabel}
              </span>
            ) : null}
          </div>

          <div className="p-2">
            {needsTelegramBinding ? (
              <Link
                className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40"
                href="/dashboard/account/security"
                onClick={close}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  <Send aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-ink">
                    {copy.telegramTitle}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-zinc-600">
                    {copy.telegramDescription}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-crimson">
                    {copy.telegramAction}
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                  </span>
                </span>
              </Link>
            ) : (
              <div className="grid justify-items-center px-4 pb-2 pt-5 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-500 ring-[6px] ring-zinc-50">
                  <Bell
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.75}
                  />
                </span>
                <p className="mt-3 text-sm font-semibold text-brand-ink">
                  {copy.empty}
                </p>
              </div>
            )}
          </div>

          <p className="flex items-start gap-2.5 rounded-b-2xl border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600">
            <Construction
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-zinc-500"
            />
            {copy.comingSoon}
          </p>
        </section>
      ) : null}
    </div>
  );
}
