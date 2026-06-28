import { getDeploymentHealth } from "@/features/monitoring/lib/deployment-probes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    data: getDeploymentHealth(),
  });
}
