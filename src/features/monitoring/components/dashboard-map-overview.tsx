"use client";

import Link from "next/link";
import { Fuel } from "lucide-react";
import { useMemo, useState } from "react";

import {
  OperationalMap,
  type OperationalMapSite,
} from "@/features/monitoring/components/operational-map";
import type {
  DashboardMonitoringSite,
  DashboardSiteStatus,
} from "@/features/monitoring/domain/dashboard-view-model";
import { formatNumber } from "@/lib/format";
import {
  STATUS_BADGE_CLASS,
  STATUS_DOT_CLASS,
} from "@/components/ui/status-tone";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

type DashboardMapOverviewProps = {
  sites: DashboardMonitoringSite[];
  initialSiteCode: string;
  priorityCount: number;
};

const statusMeta: Record<
  DashboardSiteStatus,
  {
    label: string;
    dot: string;
    badge: string;
  }
> = {
  online: {
    label: "Online",
    dot: STATUS_DOT_CLASS.success,
    badge: STATUS_BADGE_CLASS.success,
  },
  warning: {
    label: "Waspada",
    dot: STATUS_DOT_CLASS.warning,
    badge: STATUS_BADGE_CLASS.warning,
  },
  critical: {
    label: "Kritis",
    dot: "bg-red-600",
    badge: STATUS_BADGE_CLASS.danger,
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-950",
    badge: STATUS_BADGE_CLASS.neutral,
  },
};

function StatusBadge({ status }: { status: DashboardSiteStatus }) {
  const meta = statusMeta[status];

  return (
    <StatusPill badgeClass={meta.badge} dotClass={meta.dot}>
      {meta.label}
    </StatusPill>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

export function DashboardMapOverview({
  sites,
  initialSiteCode,
  priorityCount,
}: DashboardMapOverviewProps) {
  const [selectedCode, setSelectedCode] = useState(initialSiteCode);
  const selectedSite = useMemo(
    () =>
      sites.find((site) => site.code === selectedCode) ??
      sites.find((site) => site.code === initialSiteCode) ??
      sites[0],
    [initialSiteCode, selectedCode, sites],
  );

  function handleSiteChange(site: OperationalMapSite) {
    setSelectedCode(site.code);
  }

  return (
    <>
      {/* Map Monitoring Section */}
      <section
        id="peta"
        className="animate-soft-fade overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader
            label="Peta monitoring"
            title="Lokasi STO berdasarkan input manual"
            description="Titik peta diproyeksikan dari latitude dan longitude manual karena perangkat tidak memakai modul GPS."
          />

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
            {(["online", "warning", "critical", "offline"] as const).map(
              (status) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2"
                >
                  <span
                    className={`size-2 rounded-full ${statusMeta[status].dot}`}
                  />
                  {statusMeta[status].label}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <OperationalMap
            sites={sites}
            selectedCode={selectedSite?.code}
            priorityCount={priorityCount}
            onSitePreview={handleSiteChange}
            onSiteSelect={handleSiteChange}
          />
        </div>
      </section>

      {/* Right Detail Overview */}
      <Card className="animate-soft-fade">
        {selectedSite ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-500">
                  Detail overview
                </p>
                <h2
                  data-site-detail-title
                  className="mt-2 text-2xl font-semibold"
                >
                  {selectedSite.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {selectedSite.regionalLabel ?? "-"} /{" "}
                  {selectedSite.wilayahLabel ?? "-"} / Area{" "}
                  {selectedSite.areaLabel}
                </p>
              </div>
              <StatusBadge status={selectedSite.status} />
            </div>

            <div className="mt-6 flex items-start gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Fuel className="size-8" aria-hidden="true" />
              </span>
              <div>
                <div className="flex items-end gap-2">
                  <p className="text-5xl font-semibold tracking-normal">
                    {selectedSite.fillPercent}
                  </p>
                  <span className="pb-2 text-xl font-semibold text-zinc-400">
                    %
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {formatNumber(selectedSite.volumeLiter)} liter tersedia.
                  Runtime estimasi {selectedSite.runtimeHour} jam dengan asumsi
                  konsumsi konfigurasi {selectedSite.consumptionLiterPerHour}{" "}
                  L/jam.
                </p>
              </div>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-cyan-500 transition-[width] duration-500"
                style={{ width: `${selectedSite.fillPercent}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Volume", `${formatNumber(selectedSite.volumeLiter)} L`],
                ["Runtime", `${selectedSite.runtimeHour} jam`],
                ["RSSI", selectedSite.signal],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-400">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href={`/dashboard/tanks/${selectedSite.tankId}`}
              className="mt-6 block w-full rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              Buka detail tangki
            </Link>
          </>
        ) : (
          <p className="text-sm leading-6 text-zinc-500">
            Belum ada STO yang bisa ditampilkan.
          </p>
        )}
      </Card>
    </>
  );
}
