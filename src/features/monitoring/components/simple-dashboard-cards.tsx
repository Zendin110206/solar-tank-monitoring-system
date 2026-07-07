"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  cleanupDashboardTankAction,
  type DashboardAdminActionState,
} from "@/app/dashboard/actions";
import type { SimpleDashboardSite } from "@/features/monitoring/lib/simple-dashboard-model";

type SimpleDashboardCardsProps = {
  adminCleanupToken?: string;
  sites: SimpleDashboardSite[];
};

const INITIAL_ACTION_STATE: DashboardAdminActionState = {
  status: "idle",
  message: "",
};
const DELETE_TANK_CONFIRMATION = "HAPUS DATA STO";

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getTankIcon(site: SimpleDashboardSite) {
  return site.tankShape === "rectangular"
    ? "/tank-icons/square-tank.png"
    : "/tank-icons/rounded-tank.png";
}

function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        isOnline
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
      <p className="text-base font-semibold text-zinc-950">
        Tidak ada STO yang cocok dengan filter ini.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Coba ubah kata kunci, status, atau area yang dipilih.
      </p>
    </div>
  );
}

function DeleteTankDialog({
  csrfToken,
  onClose,
  site,
}: {
  csrfToken: string;
  onClose: () => void;
  site: SimpleDashboardSite;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    cleanupDashboardTankAction,
    INITIAL_ACTION_STATE,
  );
  const siteLabel = `${site.name} (${site.code})`;

  useEffect(() => {
    if (state.status === "success") {
      const timeoutId = window.setTimeout(() => {
        onClose();
        router.refresh();
      }, 350);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [onClose, router, state.status]);

  return (
    <div
      aria-labelledby="delete-dashboard-tank-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
              Hapus data monitoring
            </p>
            <h2
              className="mt-2 text-xl font-semibold text-zinc-950"
              id="delete-dashboard-tank-title"
            >
              Hapus {site.name}?
            </h2>
          </div>
          <button
            aria-label="Tutup dialog hapus data"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Data reading, perangkat, tangki, dan event untuk{" "}
          <span className="font-semibold text-zinc-950">{siteLabel}</span> akan
          dibersihkan dari dashboard. Akun, admin, template firmware, dan profil
          hardware tetap aman.
        </p>

        <form action={formAction} className="mt-5 grid gap-3">
          <input name="csrfToken" type="hidden" value={csrfToken} />
          <input name="tankId" type="hidden" value={site.tankId} />
          <input name="siteLabel" type="hidden" value={siteLabel} />
          <input
            name="confirmation"
            type="hidden"
            value={DELETE_TANK_CONFIRMATION}
          />

          {state.status === "error" && state.message ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
              {state.message}
            </p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700">
              {state.message}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-600/15 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/20 disabled:cursor-wait disabled:bg-red-300"
              disabled={pending}
              type="submit"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {pending ? "Menghapus..." : "Ya, hapus data"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function SimpleDashboardCards({
  adminCleanupToken,
  sites,
}: SimpleDashboardCardsProps) {
  const [siteToDelete, setSiteToDelete] =
    useState<SimpleDashboardSite | null>(null);

  if (sites.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sites.map((site) => (
          <article
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/10 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100"
            key={`${site.code}-${site.tankId}`}
          >
            <Link
              aria-label={`Buka detail tangki ${site.name}`}
              className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none"
              href={`/dashboard/ringkas/tanks/${site.tankId}`}
            />
            <span
              className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
                site.isOnline ? "bg-emerald-500" : "bg-red-500"
              }`}
            />

            <div className="pointer-events-none relative z-10 flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  {site.code} - {site.areaLabel}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-zinc-950">
                  {site.name}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <OnlineBadge isOnline={site.isOnline} />
                {adminCleanupToken ? (
                  <button
                    aria-label={`Hapus data monitoring ${site.name}`}
                    className="pointer-events-auto grid size-8 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/15"
                    onClick={() => setSiteToDelete(site)}
                    title={`Hapus data monitoring ${site.name}`}
                    type="button"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="pointer-events-none relative z-10 mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-500">Isi tangki</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
                  {formatLiter(site.volumeLiter)} /{" "}
                  {formatLiter(site.capacityLiter)} L
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  saat ini / kapasitas maksimal
                </p>
              </div>

              <span className="grid h-14 w-16 shrink-0 place-items-center rounded-lg bg-blue-50 ring-1 ring-blue-100 sm:h-16 sm:w-20">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-14 object-contain opacity-80 sm:h-12 sm:w-16"
                  height={576}
                  src={getTankIcon(site)}
                  width={768}
                />
              </span>
            </div>

            <div className="pointer-events-none relative z-10 mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">
                  Update terakhir
                </p>
                <p className="mt-0.5 truncate font-semibold text-zinc-950">
                  {site.updateLabel}
                </p>
              </div>
              <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                Buka detail
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>
      {adminCleanupToken && siteToDelete ? (
        <DeleteTankDialog
          csrfToken={adminCleanupToken}
          key={siteToDelete.tankId}
          onClose={() => setSiteToDelete(null)}
          site={siteToDelete}
        />
      ) : null}
    </>
  );
}
