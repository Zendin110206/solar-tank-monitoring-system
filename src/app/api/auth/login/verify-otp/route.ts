import { NextResponse, type NextRequest } from "next/server";

import { setSessionCookie } from "@/features/auth/lib/auth-session";
import { verifyAdminOtpLogin } from "@/features/auth/lib/auth-service";
import { checkRateLimit } from "@/features/auth/lib/rate-limit";
import {
  getSafeErrorMessage,
  getSafeErrorStatus,
} from "@/lib/safe-error-message";

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
      return NextResponse.json(
        {
          ok: false,
          error: "Terlalu banyak percobaan kode. Coba lagi beberapa saat.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const result = await verifyAdminOtpLogin({ challengeId, code, request });
    const response = NextResponse.json({
      ok: true,
      data: {
        redirectTo: "/dashboard",
      },
    });

    setSessionCookie({
      response,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getSafeErrorMessage(error, {
          fallbackMessage: "Kode masuk tidak valid.",
          internalMessage:
            "Kode masuk belum bisa diverifikasi karena layanan sedang disiapkan. Coba lagi nanti.",
        }),
      },
      { status: getSafeErrorStatus(error, { defaultStatus: 401 }) },
    );
  }
}
