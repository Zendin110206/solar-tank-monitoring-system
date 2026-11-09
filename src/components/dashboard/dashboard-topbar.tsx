"use client";

import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type Ref, useEffect, useMemo, useRef, useState } from "react";

import type { AuthSafeUser } from "@/features/auth/types/auth";
import { DashboardLanguageSwitch } from "./dashboard-language-switch";
import { getSearchItemsForRole } from "./dashboard-navigation";
import { DashboardNotifications } from "./dashboard-notifications";
import { DashboardSearch } from "./dashboard-search";
import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";
import { DASHBOARD_SIDEBAR_ID } from "./dashboard-sidebar";
import { DashboardUserMenu } from "./dashboard-user-menu";

const copy = DASHBOARD_SHELL_CONTENT;
// Ctrl+K juga berlaku sebagai Cmd+K di Mac.
const SEARCH_SHORTCUT_LABEL = "Ctrl K";

type DashboardTopbarProps = {
  isDrawerOpen: boolean;
  menuButtonRef: Ref<HTMLButtonElement>;
  onOpenDrawer: () => void;
  user: Pick<
    AuthSafeUser,
    "email" | "fullName" | "role" | "telegramVerifiedAt" | "username"
  >;
};

// Header semua halaman dashboard: tombol menu (layar sempit), pencarian,
// bendera bahasa, notifikasi, dan menu akun.
export function DashboardTopbar({
  isDrawerOpen,
  menuButtonRef,
  onOpenDrawer,
  user,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const searchItems = useMemo(
    () => getSearchItemsForRole(user.role),
    [user.role],
  );
  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsMobileSearchOpen(false);
  }

  // Ctrl+K (atau Cmd+K di Mac) langsung menuju kotak pencarian.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      const input = desktopSearchRef.current;

      event.preventDefault();

      if (input && input.offsetParent !== null) {
        input.focus();
      } else {
        setIsMobileSearchOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[calc(var(--dashboard-header-height)-1px)] min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:gap-6 lg:px-10">
        <button
          aria-controls={DASHBOARD_SIDEBAR_ID}
          aria-expanded={isDrawerOpen}
          aria-label={copy.openMenu}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-zinc-200 text-brand-navy-deep transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40 nav:hidden"
          onClick={onOpenDrawer}
          ref={menuButtonRef}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <span className="hidden text-lg font-bold tracking-wide text-brand-navy-deep min-[380px]:inline md:hidden">
          {copy.productName}
        </span>

        <div className="hidden min-w-0 max-w-[43rem] flex-1 md:block">
          <DashboardSearch
            inputRef={desktopSearchRef}
            items={searchItems}
            shortcutLabel={SEARCH_SHORTCUT_LABEL}
          />
        </div>
        <span aria-hidden="true" className="flex-1 md:hidden" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            aria-expanded={isMobileSearchOpen}
            aria-label={
              isMobileSearchOpen ? copy.search.close : copy.search.label
            }
            className="grid size-11 place-items-center rounded-full text-brand-navy-deep transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40 aria-expanded:bg-zinc-100 md:hidden"
            onClick={() => setIsMobileSearchOpen((current) => !current)}
            type="button"
          >
            {isMobileSearchOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Search
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.75}
              />
            )}
          </button>
          <DashboardLanguageSwitch />
          <DashboardNotifications
            needsTelegramBinding={!user.telegramVerifiedAt}
          />
          <span
            aria-hidden="true"
            className="mx-1 hidden h-9 w-px bg-zinc-200 sm:block"
          />
          <DashboardUserMenu user={user} />
        </div>
      </div>

      {isMobileSearchOpen ? (
        <div className="dashboard-pop border-t border-zinc-100 px-3 py-3 sm:px-6 md:hidden">
          <DashboardSearch
            autoFocus
            items={searchItems}
            onDone={() => setIsMobileSearchOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
