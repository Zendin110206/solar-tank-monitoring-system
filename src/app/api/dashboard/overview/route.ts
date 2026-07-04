import { requireApiUser } from "@/features/auth/lib/auth-guards";
import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/lib/monitoring-registry";
import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { listLatestMonitoringReadingsByTankWithSource } from "@/features/monitoring/lib/monitoring-storage";
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
