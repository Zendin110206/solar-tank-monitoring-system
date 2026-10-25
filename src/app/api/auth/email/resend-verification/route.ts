import type { NextRequest } from "next/server";

import { verifyCaptchaToken } from "@/features/auth/server/auth-captcha";
import { resendEmailVerification } from "@/features/auth/server/auth-service";
import { parseResendVerificationPayload } from "@/features/auth/domain/auth-validation";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  jsonCaughtError,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

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
      return jsonTooManyRequests(
        "Terlalu banyak permintaan. Coba lagi nanti.",
        rateLimit.retryAfterSeconds,
      );
    }

    const captcha = await verifyCaptchaToken({
      token: payload.captchaToken,
      remoteIp: getClientIp(request),
    });

    if (!captcha.ok) {
      return jsonError(captcha.error, 400);
    }

    await resendEmailVerification({
      identity: payload.identity,
      request,
    });

    return jsonOk({
      message:
        "Jika akun ditemukan dan belum terverifikasi, link verifikasi akan dikirim ulang.",
    });
  } catch (error) {
    return jsonCaughtError(error, {
      fallbackMessage: "Permintaan verifikasi belum bisa diproses.",
      internalMessage:
        "Permintaan verifikasi belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
    });
  }
}
