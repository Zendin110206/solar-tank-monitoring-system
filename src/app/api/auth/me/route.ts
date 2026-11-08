import type { NextRequest } from "next/server";

import { requireApiUser } from "@/features/auth/server/auth-guards";
import { jsonOk } from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({
    user: auth.user,
  });
}
