import { createAdminActionCsrfToken } from "@/features/auth/server/auth-csrf";
import { requirePageUser } from "@/features/auth/server/auth-guards";
import { SimpleDashboardView } from "@/features/monitoring/components/simple-dashboard-view";
import { buildDashboardOverview } from "@/features/monitoring/domain/dashboard-view-model";
import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/server/monitoring-registry";
import { listLatestMonitoringReadingsByTankWithSource } from "@/features/monitoring/server/monitoring-storage";
import {
  createSimpleDashboardSites,
  type SimpleDashboardSite,
} from "@/features/monitoring/domain/simple-dashboard-model";
import type { Metadata } from "next";
import { connection } from "next/server";

import { DashboardOverviewHero } from "./dashboard-overview-hero";

export const metadata: Metadata = {
  title: "Manajemen Tangki Bahan Bakar | FTM",
  description:
    "Tampilan operasional per STO untuk memantau volume tangki bahan bakar, status perangkat, dan akses cepat ke detail tangki.",
};

export const runtime = "nodejs";

export default async function SimpleDashboardPage() {
  await connection();
  const user = await requirePageUser();
  const isAdmin = user.role === "admin";
  const adminCleanupToken = isAdmin
    ? createAdminActionCsrfToken(user.sessionId)
    : undefined;

  const now = new Date();
  const [monitoringReadingsResult, monitoringReferenceResult] =
    await Promise.all([
      listLatestMonitoringReadingsByTankWithSource(),
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
    <div className="w-full min-w-0 overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <DashboardOverviewHero isAdmin={isAdmin} />
      <div className="mx-auto flex w-full max-w-[1540px] min-w-0 flex-col px-4 pb-5 pt-2 sm:px-6 lg:px-8">
        <SimpleDashboardView
          adminCleanupToken={adminCleanupToken}
          sites={simpleSites}
        />
      </div>
    </div>
  );
}
