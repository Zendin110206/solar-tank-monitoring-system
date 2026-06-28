import { buildTankReadings } from "@/features/monitoring/lib/tank-detail-view-model";
import { listMonitoringReadings } from "@/features/monitoring/lib/monitoring-storage";
import { getMonitoringReferenceData } from "@/features/monitoring/lib/monitoring-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const { tankId } = await params;
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "24h";
  const now = new Date();
  const [monitoringReadings, referenceData] = await Promise.all([
    listMonitoringReadings(),
    getMonitoringReferenceData(),
  ]);

  const readings = buildTankReadings(tankId, {
    now,
    sites: referenceData.sites,
    tanks: referenceData.tanks,
    devices: referenceData.devices,
    readings: monitoringReadings,
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
