import { getDeploymentReadiness } from "@/features/monitoring/lib/deployment-probes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const readiness = await getDeploymentReadiness();

  return Response.json(
    {
      ok: readiness.ok,
      data: readiness,
    },
    {
      status: readiness.ok ? 200 : 503,
    },
  );
}
