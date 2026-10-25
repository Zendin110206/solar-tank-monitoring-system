import type { NextRequest } from "next/server";

import { verifyCaptchaToken } from "@/features/auth/server/auth-captcha";
import { requestPasswordReset } from "@/features/auth/server/auth-service";
import { parseForgotPasswordPayload } from "@/features/auth/domain/auth-validation";
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
    const payload = parseForgotPasswordPayload(await request.json());
    const ip = getClientIp(request) ?? "unknown-ip";
    const rateLimit = await checkRateLimit({
      key: `forgot-password:${ip}:${payload.identity}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak permintaan reset. Coba lagi nanti.",
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

    await requestPasswordReset({
      identity: payload.identity,
      request,
    });

    return jsonOk({
      message:
        "Jika akun ditemukan, link reset akan dikirim ke email terdaftar.",
    });
  } catch (error) {
    return jsonCaughtError(error, {
      fallbackMessage: "Permintaan reset belum bisa diproses.",
      internalMessage:
        "Permintaan reset belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
    });
  }
}
