import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { SimpleDashboardSite } from "@/features/monitoring/lib/simple-dashboard-model";

type SimpleDashboardCardsProps = {
  sites: SimpleDashboardSite[];
};

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

export function SimpleDashboardCards({ sites }: SimpleDashboardCardsProps) {
  if (sites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sites.map((site) => (
        <Link
          aria-label={`Buka detail tangki ${site.name}`}
          className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
          href={`/dashboard/tanks/${site.tankId}`}
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
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
              Detail
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
