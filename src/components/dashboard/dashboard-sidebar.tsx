"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Headset, X } from "lucide-react";
import type { Ref } from "react";

import { openHelpdesk } from "@/features/helpdesk/components/helpdesk-events";
import {
  isNavItemActive,
  type DashboardNavGroup,
} from "./dashboard-navigation";
import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";
import { DashboardSidebarWaves } from "./dashboard-sidebar-waves";

const copy = DASHBOARD_SHELL_CONTENT;

export const DASHBOARD_SIDEBAR_ID = "dashboard-navigation";

type DashboardSidebarProps = {
  closeButtonRef: Ref<HTMLButtonElement>;
  groups: readonly DashboardNavGroup[];
  inert: boolean;
  isCollapsed: boolean;
  isTransitioning: boolean;
  onCloseDrawer: () => void;
  onToggleCollapse: () => void;
  pathname: string;
};

export function DashboardSidebar({
  closeButtonRef,
  groups,
  inert,
  isCollapsed,
  isTransitioning,
  onCloseDrawer,
  onToggleCollapse,
  pathname,
}: DashboardSidebarProps) {
  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-3.25rem))] -translate-x-[105%] flex-col bg-brand-navy-deep text-white shadow-2xl shadow-black/30 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[drawer=open]/shell:translate-x-0 motion-reduce:transition-none nav:sticky nav:top-0 nav:z-[41] nav:h-dvh nav:w-auto nav:translate-x-0 nav:border-r nav:border-white/10 nav:shadow-none"
      id={DASHBOARD_SIDEBAR_ID}
      inert={inert}
    >
      <DashboardSidebarWaves />

      {/* Merek: satu logo FTM */}
      <div className="relative z-10 flex h-[5.5rem] shrink-0 items-center gap-3 border-b border-white/10 px-5 group-data-[collapsed=true]/shell:nav:justify-center group-data-[collapsed=true]/shell:nav:px-0">
        <Link
          aria-label={copy.homeLabel}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-data-[collapsed=true]/shell:nav:flex-none"
          href="/dashboard"
          title={isCollapsed ? copy.productFullName : undefined}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-md shadow-black/25 ring-1 ring-white/40">
            <Image
              alt=""
              className="size-9"
              height={192}
              priority
              src="/logo/android-icon-192x192.png"
              width={192}
            />
          </span>
          <span className="min-w-0 whitespace-nowrap group-data-[collapsed=true]/shell:nav:hidden">
            <span className="block text-lg font-bold leading-tight tracking-wide">
              {copy.productName}
            </span>
            <span className="block truncate text-xs font-medium text-white/70">
              {copy.productFullName}
            </span>
          </span>
        </Link>

        <button
          aria-label={copy.closeMenu}
          className="grid size-10 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white nav:hidden"
          onClick={onCloseDrawer}
          ref={closeButtonRef}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {/* Tombol ciutkan, menempel di tepi kanan sidebar seperti tab */}
        <button
          aria-label={isCollapsed ? copy.expandMenu : copy.collapseMenu}
          className="absolute -right-3.5 top-1/2 hidden size-7 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-brand-navy-deep shadow-md shadow-black/20 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy-deep disabled:cursor-wait nav:grid"
          disabled={isTransitioning}
          onClick={onToggleCollapse}
          title={isCollapsed ? copy.expandMenu : copy.collapseMenu}
          type="button"
        >
          {isCollapsed ? (
            <ChevronRight aria-hidden="true" className="size-4" />
          ) : (
            <ChevronLeft aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav
        aria-label={copy.mainNavigationLabel}
        className="dashboard-sidebar-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-2 group-data-[collapsed=true]/shell:nav:px-3"
      >
        {groups.map((group) => (
          <div className="pt-5" key={group.id}>
            <p className="whitespace-nowrap px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/60 group-data-[collapsed=true]/shell:nav:sr-only">
              {group.label}
            </p>
            <span
              aria-hidden="true"
              className="mx-auto mb-3 hidden h-px w-8 bg-white/15 group-data-[collapsed=true]/shell:nav:block"
            />
            <ul className="grid gap-1">
              {group.items.map((item) => {
                const isActive = isNavItemActive(item, pathname);
                const Icon = item.icon;

                return (
                  <li key={item.id}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`group/item flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-data-[collapsed=true]/shell:nav:justify-center group-data-[collapsed=true]/shell:nav:px-0 ${
                        isActive
                          ? "bg-brand-crimson text-white shadow-lg shadow-black/30"
                          : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                      }`}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`size-5 shrink-0 transition-colors duration-150 ${
                          isActive
                            ? "text-white"
                            : "text-white/70 group-hover/item:text-white"
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="min-w-0 truncate group-data-[collapsed=true]/shell:nav:sr-only">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Kartu bantuan: membuka obrolan layanan bantuan */}
      <div className="relative z-10 shrink-0 px-4 pb-5 pt-3 group-data-[collapsed=true]/shell:nav:px-3">
        <button
          className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-brand-navy-deep/60 p-3 text-left backdrop-blur-md transition-colors duration-150 hover:border-white/25 hover:bg-brand-navy-deep/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-data-[collapsed=true]/shell:nav:hidden"
          onClick={() => {
            onCloseDrawer();
            openHelpdesk();
          }}
          type="button"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-crimson text-white shadow-md shadow-black/30">
            <Headset aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {copy.helpCard.title}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-white/75">
              {copy.helpCard.description}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-white/60"
          />
        </button>
        <button
          aria-label={`${copy.helpCard.title} ${copy.helpCard.description}`}
          className="mx-auto hidden size-11 place-items-center rounded-full bg-brand-crimson text-white shadow-md shadow-black/30 transition-colors hover:bg-brand-crimson-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-data-[collapsed=true]/shell:nav:grid"
          onClick={openHelpdesk}
          title={copy.helpCard.description}
          type="button"
        >
          <Headset aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
