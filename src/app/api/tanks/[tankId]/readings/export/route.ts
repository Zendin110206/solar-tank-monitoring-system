import { requireApiUser } from "@/features/auth/lib/auth-guards";
import { getMonitoringReferenceData } from "@/features/monitoring/lib/monitoring-registry";
import { listMonitoringReadingsForTank } from "@/features/monitoring/lib/monitoring-storage";
import { createTankReadingsCsv } from "@/features/monitoring/lib/readings-export";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeFilenameSegment(value: string): string {
  const clean = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "tank";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tankId: string }> },
) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { tankId } = await params;
  const [readings, referenceData] = await Promise.all([
    listMonitoringReadingsForTank(tankId),
    getMonitoringReferenceData(),
  ]);
  const tank = referenceData.tanks.find((item) => item.id === tankId);

  if (!tank) {
    return Response.json(
      {
        ok: false,
        error: "Tangki tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const site = referenceData.sites.find((item) => item.id === tank.siteId);
  const filename = `solartank-${sanitizeFilenameSegment(
    site?.code ?? tank.id,
  )}-${sanitizeFilenameSegment(tank.name)}-readings.csv`;

  return new Response(createTankReadingsCsv(readings), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

