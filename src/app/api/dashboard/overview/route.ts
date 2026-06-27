import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { listMonitoringReadingsWithSource } from "@/features/monitoring/lib/monitoring-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const monitoringReadingsResult = await listMonitoringReadingsWithSource();
  const overview = buildDashboardOverview({
    now: new Date(),
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
