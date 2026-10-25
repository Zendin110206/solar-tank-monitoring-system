import type { NextRequest } from "next/server";

import { getRequestSessionUser } from "@/features/auth/server/auth-session";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import { getOrCreateHelpdeskSession } from "@/features/helpdesk/server/helpdesk-service";
import { getSafeErrorMessage } from "@/lib/safe-error-message";
import {
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}

function getStringPayloadValue(payload: unknown, key: string): string | null {
  const value = String(
    ((payload ?? {}) as Record<string, unknown>)[key] ?? "",
  ).trim();

  return value || null;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      key: `helpdesk-session:${getClientKey(request)}`,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak permintaan helpdesk.",
        rateLimit.retryAfterSeconds,
      );
    }

    const payload = await request.json().catch(() => ({}));
    const user = await getRequestSessionUser(request);
    const bundle = await getOrCreateHelpdeskSession({
      pagePath: getStringPayloadValue(payload, "pagePath"),
      sessionToken: getStringPayloadValue(payload, "sessionToken"),
      user,
    });

    return jsonOk(bundle);
  } catch (error) {
    return jsonError(
      getSafeErrorMessage(error, {
        fallbackMessage: "Sesi helpdesk belum bisa dibuka.",
        internalMessage:
          "Sesi helpdesk belum bisa dibuka karena layanan database belum siap.",
      }),
      500,
    );
  }
}
