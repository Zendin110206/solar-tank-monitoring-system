import { buildTankDetail } from "@/features/monitoring/lib/tank-detail-view-model";
import { getMonitoringReadings } from "@/features/monitoring/lib/telemetry-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const { tankId } = await params;
  const detail = buildTankDetail(tankId, {
    now: new Date(),
    readings: getMonitoringReadings(),
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
