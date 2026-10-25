import type { NextRequest } from "next/server";

import { checkRateLimit } from "@/features/auth/server/rate-limit";
import { loginWithPassword } from "@/features/auth/server/auth-service";
import { parseLoginPayload } from "@/features/auth/domain/auth-validation";
import { setSessionCookie } from "@/features/auth/server/auth-session";
import {
  jsonCaughtError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientKey(request: NextRequest, identity: string) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown-ip";

  return `login:${ip}:${identity}`;
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseLoginPayload(await request.json());
    const rateLimit = await checkRateLimit({
      key: getClientKey(request, payload.identity),
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak percobaan masuk. Coba lagi beberapa saat.",
        rateLimit.retryAfterSeconds,
      );
    }

    const loginResult = await loginWithPassword({
      identity: payload.identity,
      password: payload.password,
      request,
    });

    if (loginResult.status === "otp_required") {
      return jsonOk({
        requiresOtp: true,
        challengeId: loginResult.challengeId,
        delivery: loginResult.delivery,
      });
    }

    const response = jsonOk({
      requiresOtp: false,
      redirectTo: "/dashboard",
    });

    setSessionCookie({
      response,
      sessionToken: loginResult.sessionToken,
      expiresAt: loginResult.expiresAt,
    });

    return response;
  } catch (error) {
    return jsonCaughtError(
      error,
      {
        fallbackMessage: "Login gagal. Periksa kembali data masuk Anda.",
        internalMessage:
          "Login belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
      },
      { defaultStatus: 401 },
    );
  }
}
