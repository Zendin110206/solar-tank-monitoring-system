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
import { getClientKey, getStringPayloadValue } from "@/lib/http/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
