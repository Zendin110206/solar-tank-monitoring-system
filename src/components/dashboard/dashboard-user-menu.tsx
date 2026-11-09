"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { useId, useState } from "react";

import type { AuthSafeUser } from "@/features/auth/types/auth";
import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";
import { useDashboardPopover } from "./use-dashboard-popover";

const copy = DASHBOARD_SHELL_CONTENT.account;

type DashboardUserMenuProps = {
  user: Pick<
    AuthSafeUser,
    "email" | "fullName" | "role" | "telegramVerifiedAt" | "username"
  >;
};

function getAvatarLabel(user: DashboardUserMenuProps["user"]) {
  const nameParts = user.fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0] ?? ""}${nameParts[1][0] ?? ""}`.toUpperCase();
  }

  return (nameParts[0]?.slice(0, 2) || user.username.slice(0, 2) || "ST")
    .toUpperCase()
    .slice(0, 2);
}

// Tombol akun di header: lingkaran inisial, nama, dan panah. Panelnya berisi
// identitas, tautan profil dan keamanan akun, serta tombol keluar.
export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const router = useRouter();
  const panelId = useId();
  const { close, isOpen, rootRef, toggle, triggerRef } = useDashboardPopover();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const avatarLabel = getAvatarLabel(user);
  const needsTelegramBinding = !user.telegramVerifiedAt;

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const itemClass =
    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-ink transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40";

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={copy.open}
        className="group/profile flex items-center gap-2.5 rounded-xl p-1 text-left text-brand-navy-deep transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40 aria-expanded:bg-zinc-100 lg:gap-3 lg:pr-2.5"
        onClick={toggle}
        ref={triggerRef}
        type="button"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-navy-deep text-sm sm:size-11 font-semibold text-white ring-2 ring-white shadow-[0_0_0_3px_rgb(12_28_55/0.15)]">
          {avatarLabel}
        </span>
        <span className="hidden max-w-[12.5rem] truncate text-[0.95rem] font-bold lg:block">
          {user.fullName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden size-4 shrink-0 text-zinc-500 transition-transform duration-150 group-aria-expanded/profile:rotate-180 sm:block"
        />
      </button>

      {isOpen ? (
        <div
          className="dashboard-pop fixed inset-x-3 top-[calc(var(--dashboard-header-height)+0.5rem)] z-50 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-zinc-950/15 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[17rem]"
          id={panelId}
        >
          <div className="flex items-center gap-3 px-2 pb-3 pt-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-navy-deep text-sm font-semibold text-white">
              {avatarLabel}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-brand-ink">
                {user.fullName}
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {user.email}
              </span>
              <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                {user.role === "admin" ? copy.roleAdmin : copy.roleUser}
              </span>
            </span>
          </div>

          <ul className="grid gap-0.5 border-y border-zinc-100 py-2">
            <li>
              <Link
                className={itemClass}
                href="/dashboard/profile"
                onClick={close}
              >
                <UserRound
                  aria-hidden="true"
                  className="size-4 text-zinc-500"
                />
                {copy.profile}
              </Link>
            </li>
            <li>
              <Link
                className={itemClass}
                href="/dashboard/account/security"
                onClick={close}
              >
                <KeyRound aria-hidden="true" className="size-4 text-zinc-500" />
                <span className="flex-1">{copy.security}</span>
                {needsTelegramBinding ? (
                  <span
                    className="size-2 rounded-full bg-amber-500"
                    title={DASHBOARD_SHELL_CONTENT.notifications.telegramTitle}
                  >
                    <span className="sr-only">
                      {DASHBOARD_SHELL_CONTENT.notifications.telegramTitle}
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          </ul>

          <button
            className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-crimson transition-colors duration-150 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson/40 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {isLoggingOut ? copy.signingOut : copy.signOut}
          </button>
        </div>
      ) : null}
    </div>
  );
}
