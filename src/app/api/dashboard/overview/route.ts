import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { listMonitoringDataWithSource } from "@/features/monitoring/lib/monitoring-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const monitoringReadingsResult = await listMonitoringDataWithSource();
  const overview = buildDashboardOverview({
    now: new Date(),
    sites: monitoringReadingsResult.sites,
    tanks: monitoringReadingsResult.tanks,
    devices: monitoringReadingsResult.devices,
    readings: monitoringReadingsResult.readings,
  });

  return Response.json({
    ok: true,
    data: overview,
    meta: {
      storage: monitoringReadingsResult.source,
    },
  });
}
