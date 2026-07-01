import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/lib/monitoring-registry";
import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import {
  SimpleDashboardCards,
  type SimpleDashboardSite,
} from "@/features/monitoring/components/simple-dashboard-cards";
import { listMonitoringReadingsWithSource } from "@/features/monitoring/lib/monitoring-storage";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Dashboard Simple Monitoring Solar | SolarTank",
  description:
    "Ringkasan kartu per STO untuk memantau volume tangki solar dan membuka detail tangki dengan satu klik.",
};

export const runtime = "nodejs";

export default async function SimpleDashboardPage() {
  await connection();

  const now = new Date();
  const [monitoringReadingsResult, monitoringReferenceResult] =
    await Promise.all([
      listMonitoringReadingsWithSource(),
      getMonitoringReferenceDataWithSource(),
    ]);
  const dashboardOverview = buildDashboardOverview({
    now,
    sites: monitoringReferenceResult.reference.sites,
    tanks: monitoringReferenceResult.reference.tanks,
    devices: monitoringReferenceResult.reference.devices,
    readings: monitoringReadingsResult.readings,
  });
  const monitoredSites = dashboardOverview.rows;
  const capacityByTankId = new Map(
    monitoringReferenceResult.reference.tanks.map((tank) => [
      tank.id,
      tank.capacityLiter,
    ]),
  );
  const simpleSites: SimpleDashboardSite[] = monitoredSites.map((site) => ({
    code: site.code,
    name: site.name,
    tankId: site.tankId,
    volumeLiter: site.volumeLiter,
    capacityLiter: capacityByTankId.get(site.tankId) ?? 0,
    updateLabel: site.updateLabel,
    isOnline: site.deviceStatus === "online",
  }));
  return (
    <main className="h-screen overflow-hidden bg-[#f5faf8] text-zinc-950">
      {/* Simple Dashboard Header */}
      <header className="h-16 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Kembali ke beranda SolarTank"
          >
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 lg:flex">
            <span className="text-zinc-950">Dashboard Simple</span>
            <Link
              href="/dashboard/detail"
              className="transition hover:text-red-600"
            >
              Dashboard Detail
            </Link>
            <Link
              href="/dashboard/locations"
              className="transition hover:text-red-600"
            >
              Konfigurasi Lokasi
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1540px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <SimpleDashboardCards sites={simpleSites} />
      </div>
    </main>
  );
}
