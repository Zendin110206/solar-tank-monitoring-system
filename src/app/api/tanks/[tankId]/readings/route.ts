import { buildTankReadings } from "@/features/monitoring/lib/tank-detail-view-model";
import { getMonitoringReadings } from "@/features/monitoring/lib/telemetry-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const { tankId } = await params;
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "24h";
  const readings = buildTankReadings(tankId, {
    now: new Date(),
    readings: getMonitoringReadings(),
  });

  if (readings.length === 0) {
    return Response.json(
      {
        ok: false,
        error: "Riwayat tangki tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    data: {
      tankId,
      range,
      items: readings,
    },
  });
}
