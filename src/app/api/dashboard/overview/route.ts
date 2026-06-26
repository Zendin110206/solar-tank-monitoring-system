import { buildDashboardOverview } from "@/features/monitoring/lib/dashboard-view-model";
import { getMonitoringReadings } from "@/features/monitoring/lib/telemetry-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const overview = buildDashboardOverview({
    now: new Date(),
    readings: getMonitoringReadings(),
  });

  return Response.json({
    ok: true,
    data: overview,
  });
}
