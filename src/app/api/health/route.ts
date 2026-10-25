import { getDeploymentHealth } from "@/features/monitoring/lib/deployment-probes";
import { jsonOk } from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return jsonOk(getDeploymentHealth());
}
