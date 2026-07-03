import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/features/auth/lib/auth-guards";
import { listCurrentUserSessions } from "@/features/auth/lib/auth-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  const sessions = await listCurrentUserSessions({ user: auth.user });

  return NextResponse.json({
    ok: true,
    data: { sessions },
  });
}
