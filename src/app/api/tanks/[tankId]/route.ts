import { buildTankDetail } from "@/features/monitoring/lib/tank-detail-view-model";
import { listMonitoringReadings } from "@/features/monitoring/lib/monitoring-storage";
import { getMonitoringReferenceData } from "@/features/monitoring/lib/monitoring-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const { tankId } = await params;
  const now = new Date();
  const [readings, referenceData] = await Promise.all([
    listMonitoringReadings(),
    getMonitoringReferenceData(),
  ]);
  const detail = buildTankDetail(tankId, {
    now,
    sites: referenceData.sites,
    tanks: referenceData.tanks,
    devices: referenceData.devices,
    readings,
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
