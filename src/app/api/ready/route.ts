import type { NextRequest } from "next/server";

import {
  getReadinessCheckToken,
  isProductionLikeEnvironment,
} from "@/features/auth/server/auth-config";
import { requireApiUser } from "@/features/auth/server/auth-guards";
import { getDeploymentReadiness } from "@/features/monitoring/server/deployment-probes";
import { hasValidReadinessToken } from "@/features/monitoring/server/readiness-access";
import { jsonError } from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorizeReadiness(request: NextRequest) {
  const readinessToken = getReadinessCheckToken();

  if (
    hasValidReadinessToken({
      expectedToken: readinessToken,
      headers: request.headers,
    })
  ) {
    return null;
  }

  if (!isProductionLikeEnvironment() && !readinessToken) {
    return null;
  }

  const auth = await requireApiUser(request, ["admin"]);

  if (auth.ok) {
    return null;
  }

  return jsonError("Readiness operasional hanya tersedia untuk admin.", 401);
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = await authorizeReadiness(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

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
