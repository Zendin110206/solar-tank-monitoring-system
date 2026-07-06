"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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

function DeleteTankForm({
  csrfToken,
  site,
}: {
  csrfToken: string;
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
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="grid gap-1">
      <input name="csrfToken" type="hidden" value={csrfToken} />
      <input name="tankId" type="hidden" value={site.tankId} />
      <input name="siteLabel" type="hidden" value={siteLabel} />
      <input
        name="confirmation"
        type="hidden"
        value={DELETE_TANK_CONFIRMATION}
      />
      <button
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/15 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onClick={(event) => {
          if (
            !window.confirm(
              `Hapus ${siteLabel} dari monitoring?\n\nData reading, perangkat, tangki, dan event terkait STO ini akan dibersihkan. Akun, admin, template firmware, dan profil hardware tidak ikut dihapus.`,
            )
          ) {
            event.preventDefault();
          }
        }}
        title={`Hapus data monitoring ${siteLabel}`}
        type="submit"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        {pending ? "Menghapus" : "Hapus"}
      </button>
      {state.status === "error" && state.message ? (
        <p className="max-w-48 text-xs font-semibold leading-5 text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function SimpleDashboardCards({
  adminCleanupToken,
  sites,
}: SimpleDashboardCardsProps) {
  if (sites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sites.map((site) => (
        <article
          className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
          key={`${site.code}-${site.tankId}`}
        >
          <span
            className={`absolute inset-x-0 top-0 h-1 ${
              site.isOnline ? "bg-emerald-500" : "bg-red-500"
            }`}
          />

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                {site.code} - {site.areaLabel}
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-snug text-zinc-950">
                {site.name}
              </h2>
            </div>
            <OnlineBadge isOnline={site.isOnline} />
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
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

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">
                Update terakhir
              </p>
              <p className="mt-0.5 truncate font-semibold text-zinc-950">
                {site.updateLabel}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {adminCleanupToken ? (
                <DeleteTankForm csrfToken={adminCleanupToken} site={site} />
              ) : null}
              <Link
                aria-label={`Buka detail tangki ${site.name}`}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
                href={`/dashboard/ringkas/tanks/${site.tankId}`}
              >
                Detail
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
