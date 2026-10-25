import type { NextRequest } from "next/server";

import { requireApiUser } from "@/features/auth/server/auth-guards";
import { startTelegramBinding } from "@/features/auth/server/auth-service";
import { isTelegramConfigured } from "@/features/auth/server/auth-telegram";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isTelegramConfigured()) {
    return jsonError("Telegram bot belum dikonfigurasi.", 503);
  }

  const rateLimit = await checkRateLimit({
    key: `telegram-bind:${auth.user.id}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return jsonTooManyRequests(
      "Terlalu banyak permintaan binding Telegram.",
      rateLimit.retryAfterSeconds,
    );
  }

  const result = await startTelegramBinding({
    user: auth.user,
    request,
  });

  return jsonOk({
    token: result.token,
    deepLink: result.deepLink,
    expiresAt: result.expiresAt.toISOString(),
  });
}
