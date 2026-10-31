import type { NextRequest } from "next/server";

import {
  clearSessionCookie,
  getRequestSessionUser,
} from "@/features/auth/server/auth-session";
import { logoutSession } from "@/features/auth/server/auth-service";
import { jsonOk } from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getRequestSessionUser(request);

  if (user) {
    await logoutSession(user.sessionId);
  }

  const response = jsonOk();
  clearSessionCookie(response);

  return response;
}
