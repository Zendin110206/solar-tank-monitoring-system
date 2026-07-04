import { LogoutButton } from "@/features/auth/components/logout-button";
import { requirePageUser } from "@/features/auth/lib/auth-guards";
import { SimpleDashboardView } from "@/features/monitoring/components/simple-dashboard-view";
import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/lib/monitoring-registry";
import { listMonitoringReadingsWithSource } from "@/features/monitoring/lib/monitoring-storage";
import {
  createSimpleDashboardSites,
  type SimpleDashboardSite,
} from "@/features/monitoring/lib/simple-dashboard-model";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Monitoring Tangki Solar | SolarTank",
  description:
    "Tampilan operasional per STO untuk memantau volume tangki solar, status perangkat, dan akses cepat ke detail tangki.",
};

export const runtime = "nodejs";

export default async function SimpleDashboardPage() {
  await connection();
  const user = await requirePageUser();
  const isAdmin = user.role === "admin";

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
  const capacityByTankId = new Map(
    monitoringReferenceResult.reference.tanks.map((tank) => [
      tank.id,
      tank.capacityLiter,
    ]),
  );
  const shapeByTankId = new Map(
    monitoringReferenceResult.reference.tanks.map((tank) => [
      tank.id,
      tank.shape,
    ]),
  );
  const simpleSites: SimpleDashboardSite[] = createSimpleDashboardSites(
    dashboardOverview.rows,
    capacityByTankId,
    shapeByTankId,
  );

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1540px] min-w-0 flex-col gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
          <Link
            href="/"
            className="flex w-fit shrink-0 items-center gap-3"
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

          <nav className="grid w-full min-w-0 grid-cols-1 items-center gap-2 py-1 text-sm font-semibold text-zinc-600 sm:flex sm:w-auto">
            <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-center text-white shadow-lg shadow-blue-600/15">
              Monitoring Tangki
            </span>
            {isAdmin ? (
              <>
                <Link
                  href="/dashboard/detail"
                  className="shrink-0 rounded-lg px-3 py-2 text-center transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
                >
                  Analisis Teknis
                </Link>
                <Link
                  href="/dashboard/locations"
                  className="shrink-0 rounded-lg px-3 py-2 text-center transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
                >
                  Lokasi dan Perangkat
                </Link>
                <Link
                  href="/dashboard/admin/users"
                  className="shrink-0 rounded-lg px-3 py-2 text-center transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
                >
                  Manajemen Pengguna
                </Link>
              </>
            ) : null}
            <span className="shrink-0 rounded-lg bg-zinc-100 px-3 py-2 text-center text-zinc-700">
              {user.fullName}
            </span>
            <Link
              href="/dashboard/account/security"
              className="shrink-0 rounded-lg px-3 py-2 text-center transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
            >
              Keamanan Akun
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1540px] min-w-0 flex-col px-4 py-5 sm:px-6 lg:px-8">
        <SimpleDashboardView sites={simpleSites} />
      </div>
    </main>
  );
}
