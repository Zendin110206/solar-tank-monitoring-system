import Link from "next/link";
import { Droplets } from "lucide-react";

export type SimpleDashboardSite = {
  code: string;
  name: string;
  tankId: string;
  volumeLiter: number;
  capacityLiter: number;
  updateLabel: string;
  isOnline: boolean;
};

type SimpleDashboardCardsProps = {
  sites: SimpleDashboardSite[];
};

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        isOnline
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-zinc-100 text-zinc-700 ring-zinc-200"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          isOnline ? "bg-emerald-500" : "bg-zinc-950"
        }`}
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

export function SimpleDashboardCards({ sites }: SimpleDashboardCardsProps) {
  return (
    <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
        Ringkasan Monitoring per STO
      </h1>

      <div className="mt-4 max-h-[calc(100vh-11rem)] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sites.map((site) => (
            <Link
              key={site.code}
              href={`/dashboard/tanks/${site.tankId}`}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
              aria-label={`Buka detail tangki ${site.name}`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${
                  site.isOnline ? "bg-emerald-500" : "bg-zinc-950"
                }`}
              />

              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-950">
                  {site.name}
                </h2>
                <OnlineBadge isOnline={site.isOnline} />
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Isi tangki
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                    {formatLiter(site.volumeLiter)} L
                    <span className="mx-1 text-xl font-medium text-zinc-400">
                      /
                    </span>
                    {formatLiter(site.capacityLiter)} L
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    saat ini / kapasitas maksimal
                  </p>
                </div>

                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Droplets className="size-5" aria-hidden="true" />
                </span>
              </div>

              <div className="mt-6 rounded-lg bg-white px-3 py-3 text-sm ring-1 ring-zinc-200">
                <div>
                  <p className="text-xs font-medium text-zinc-400">
                    Update terakhir
                  </p>
                  <p className="mt-1 font-semibold text-zinc-950">
                    {site.updateLabel}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
