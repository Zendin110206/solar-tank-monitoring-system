import { buildTankDetail } from "@/features/monitoring/lib/tank-detail-view-model";
import { listMonitoringDataWithSource } from "@/features/monitoring/lib/monitoring-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const { tankId } = await params;
  const monitoringData = await listMonitoringDataWithSource();
  const detail = buildTankDetail(tankId, {
    now: new Date(),
    sites: monitoringData.sites,
    tanks: monitoringData.tanks,
    devices: monitoringData.devices,
    readings: monitoringData.readings,
  });

  if (!detail) {
    return Response.json(
      {
        ok: false,
        error: "Tangki tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    data: detail,
  });
}
