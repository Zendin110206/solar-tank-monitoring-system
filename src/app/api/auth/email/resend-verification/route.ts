import { NextResponse, type NextRequest } from "next/server";

import { verifyCaptchaToken } from "@/features/auth/lib/auth-captcha";
import { resendEmailVerification } from "@/features/auth/lib/auth-service";
import { parseResendVerificationPayload } from "@/features/auth/lib/auth-validation";
import { checkRateLimit } from "@/features/auth/lib/rate-limit";
import {
  getSafeErrorMessage,
  getSafeErrorStatus,
} from "@/lib/safe-error-message";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseResendVerificationPayload(await request.json());
    const ip = getClientIp(request) ?? "unknown-ip";
    const rateLimit = await checkRateLimit({
      key: `resend-email-verification:${ip}:${payload.identity}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Terlalu banyak permintaan. Coba lagi nanti.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const captcha = await verifyCaptchaToken({
      token: payload.captchaToken,
      remoteIp: getClientIp(request),
    });

    if (!captcha.ok) {
      return NextResponse.json(
        { ok: false, error: captcha.error },
        { status: 400 },
      );
    }

    await resendEmailVerification({
      identity: payload.identity,
      request,
    });

    return NextResponse.json({
      ok: true,
      data: {
        message:
          "Jika akun ditemukan dan belum terverifikasi, link verifikasi akan dikirim ulang.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getSafeErrorMessage(error, {
          fallbackMessage: "Permintaan verifikasi belum bisa diproses.",
          internalMessage:
            "Permintaan verifikasi belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
        }),
      },
      { status: getSafeErrorStatus(error) },
    );
  }
}
