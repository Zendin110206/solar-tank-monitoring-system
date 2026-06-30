import { getMonitoringReferenceDataWithSource } from "@/features/monitoring/lib/monitoring-registry";
import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { listMonitoringReadingsWithSource } from "@/features/monitoring/lib/monitoring-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [monitoringReadingsResult, monitoringReferenceResult] =
    await Promise.all([
      listMonitoringReadingsWithSource(),
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
