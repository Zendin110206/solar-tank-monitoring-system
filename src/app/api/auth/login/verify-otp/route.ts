import type { NextRequest } from "next/server";

import { setSessionCookie } from "@/features/auth/server/auth-session";
import { verifyAdminOtpLogin } from "@/features/auth/server/auth-service";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  jsonCaughtError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const challengeId = String(body.challengeId ?? "").trim();
    const code = String(body.code ?? "").trim();

    if (!challengeId || !/^\d{6}$/.test(code)) {
      throw new Error("Kode masuk tidak valid.");
    }

    const rateLimit = await checkRateLimit({
      key: `otp:${challengeId}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak percobaan kode. Coba lagi beberapa saat.",
        rateLimit.retryAfterSeconds,
      );
    }

    const result = await verifyAdminOtpLogin({ challengeId, code, request });
    const response = jsonOk({
      redirectTo: "/dashboard",
    });

    setSessionCookie({
      response,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
    });

    return response;
  } catch (error) {
    return jsonCaughtError(
      error,
      {
        fallbackMessage: "Kode masuk tidak valid.",
        internalMessage:
          "Kode masuk belum bisa diverifikasi karena layanan sedang disiapkan. Coba lagi nanti.",
      },
      { defaultStatus: 401 },
    );
  }
}
