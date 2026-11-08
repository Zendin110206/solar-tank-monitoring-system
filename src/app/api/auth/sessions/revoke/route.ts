import type { NextRequest } from "next/server";

import { requireApiUser } from "@/features/auth/server/auth-guards";
import { revokeCurrentUserSessionById } from "@/features/auth/server/auth-service";
import { jsonCaughtError, jsonOk } from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionId = String(body.sessionId ?? "").trim();

    if (!sessionId) {
      throw new Error("Sesi tidak valid.");
    }

    await revokeCurrentUserSessionById({
      user: auth.user,
      sessionId,
    });

    return jsonOk({ message: "Sesi berhasil dicabut." });
  } catch (error) {
    return jsonCaughtError(error, {
      fallbackMessage: "Sesi belum bisa dicabut.",
      internalMessage:
        "Sesi belum bisa dicabut karena layanan sedang disiapkan. Coba lagi nanti.",
    });
  }
}
