import { requireApiUser } from "@/features/auth/server/auth-guards";
import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/server/monitoring-registry";
import { buildDashboardOverview } from "@/features/monitoring/domain/dashboard-view-model";
import { listLatestMonitoringReadingsByTankWithSource } from "@/features/monitoring/server/monitoring-storage";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const [monitoringReadingsResult, monitoringReferenceResult] =
    await Promise.all([
      listLatestMonitoringReadingsByTankWithSource(),
      getMonitoringReferenceDataWithSource(),
    ]);
  const overview = buildDashboardOverview({
    now: new Date(),
    sites: monitoringReferenceResult.reference.sites,
    tanks: monitoringReferenceResult.reference.tanks,
    devices: monitoringReferenceResult.reference.devices,
    readings: monitoringReadingsResult.readings,
  });

  return Response.json({
    ok: true,
    data: overview,
    meta: {
      storage: monitoringReadingsResult.source,
      registry: monitoringReferenceResult.source,
    },
  });
}
