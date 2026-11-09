"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  type TransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { AuthSafeUser } from "@/features/auth/types/auth";
import { getNavGroupsForRole } from "./dashboard-navigation";
import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";
import { DASHBOARD_SIDEBAR_ID, DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

const copy = DASHBOARD_SHELL_CONTENT;
const DESKTOP_QUERY = "(min-width: 68rem)";
const MAIN_ID = "konten-utama";
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DashboardShellProps = {
  children: ReactNode;
  footer: ReactNode;
  user: Pick<
    AuthSafeUser,
    "email" | "fullName" | "role" | "telegramVerifiedAt" | "username"
  >;
};

// Kerangka semua halaman dashboard: sidebar kiri, header atas, isi halaman.
// Di layar lebar sidebar bisa diciutkan menjadi deretan ikon; di layar yang
// lebih sempit sidebar menjadi panel geser yang dibuka lewat tombol menu.
export function DashboardShell({
  children,
  footer,
  user,
}: DashboardShellProps) {
  const pathname = usePathname();
  const groups = getNavGroupsForRole(user.role);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Panel geser selalu tertutup setelah pindah halaman.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => {
      setIsDesktop(media.matches);

      if (media.matches) {
        setIsDrawerOpen(false);
      }
    };

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  }, []);

  // Saat panel geser terbuka: fokus masuk ke panel, Tab tidak keluar dari
  // panel, Escape menutupnya, dan halaman di belakang tidak ikut tergulir.
  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const sidebar = document.getElementById(DASHBOARD_SIDEBAR_ID);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab" || !sidebar) {
        return;
      }

      const focusable = [
        ...sidebar.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, isDrawerOpen]);

  function toggleCollapse() {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setIsCollapsed((current) => !current);
  }

  function finishTransition(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "grid-template-columns"
    ) {
      setIsTransitioning(false);
    }
  }

  return (
    <div
      className="group/shell min-h-dvh min-w-0 bg-[#f5faf8] nav:grid nav:grid-cols-[20rem_minmax(0,1fr)] nav:transition-[grid-template-columns] nav:duration-200 nav:ease-[cubic-bezier(0.22,1,0.36,1)] nav:data-[collapsed=true]:grid-cols-[5.25rem_minmax(0,1fr)] motion-reduce:transition-none"
      data-collapsed={isCollapsed}
      data-drawer={isDrawerOpen ? "open" : "closed"}
      onTransitionEnd={finishTransition}
    >
      <a
        className="sr-only z-[60] rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-brand-crimson"
        href={`#${MAIN_ID}`}
      >
        {copy.skipToContent}
      </a>

      <button
        aria-hidden="true"
        className="fixed inset-0 z-[45] bg-brand-navy-deep/50 opacity-0 transition-opacity duration-200 pointer-events-none group-data-[drawer=open]/shell:pointer-events-auto group-data-[drawer=open]/shell:opacity-100 motion-reduce:transition-none nav:hidden"
        onClick={closeDrawer}
        tabIndex={-1}
        type="button"
      />

      <DashboardSidebar
        closeButtonRef={closeButtonRef}
        groups={groups}
        inert={!isDesktop && !isDrawerOpen}
        isCollapsed={isCollapsed}
        isTransitioning={isTransitioning}
        onCloseDrawer={closeDrawer}
        onToggleCollapse={toggleCollapse}
        pathname={pathname}
      />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <DashboardTopbar
          isDrawerOpen={isDrawerOpen}
          menuButtonRef={menuButtonRef}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          user={user}
        />
        <main
          className="min-w-0 flex-1 focus:outline-none"
          id={MAIN_ID}
          tabIndex={-1}
        >
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
