import type { NextRequest } from "next/server";

import { getRequestSessionUser } from "@/features/auth/server/auth-session";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  addUserHelpdeskMessage,
  getOrCreateHelpdeskSession,
  normalizeHelpdeskMessage,
} from "@/features/helpdesk/server/helpdesk-service";
import { notifyAdminsHelpdeskMessageCreated } from "@/features/helpdesk/server/helpdesk-notifications";
import { getSafeErrorMessage } from "@/lib/safe-error-message";
import {
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";
import { getClientKey, getStringPayloadValue } from "@/lib/http/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get("sessionToken");

    if (!sessionToken) {
      return jsonError("Token sesi helpdesk tidak tersedia.", 400);
    }

    const bundle = await getOrCreateHelpdeskSession({
      pagePath: searchParams.get("pagePath"),
      sessionToken,
      user: await getRequestSessionUser(request),
    });

    return jsonOk(bundle);
  } catch (error) {
    return jsonError(
      getSafeErrorMessage(error, {
        fallbackMessage: "Pesan helpdesk belum bisa dimuat.",
        internalMessage:
          "Pesan helpdesk belum bisa dimuat karena layanan database belum siap.",
      }),
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      key: `helpdesk-message:${getClientKey(request)}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak pesan helpdesk.",
        rateLimit.retryAfterSeconds,
      );
    }

    const payload = await request.json().catch(() => ({}));
    const user = await getRequestSessionUser(request);
    const result = await addUserHelpdeskMessage({
      body: normalizeHelpdeskMessage(getStringPayloadValue(payload, "message")),
      pagePath: getStringPayloadValue(payload, "pagePath"),
      sessionToken: getStringPayloadValue(payload, "sessionToken"),
      user,
    });

    await notifyAdminsHelpdeskMessageCreated({
      message: result.message,
      session: result.session,
    }).catch(() => undefined);

    return jsonOk(result);
  } catch (error) {
    return jsonError(
      getSafeErrorMessage(error, {
        fallbackMessage: "Pesan helpdesk belum bisa dikirim.",
        internalMessage:
          "Pesan helpdesk belum bisa dikirim karena layanan database belum siap.",
      }),
      500,
    );
  }
}
