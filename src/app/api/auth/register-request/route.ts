import type { NextRequest } from "next/server";

import { verifyCaptchaToken } from "@/features/auth/server/auth-captcha";
import { isAccessRequestEnabled } from "@/features/auth/server/auth-config";
import { submitAccessRequest } from "@/features/auth/server/auth-service";
import { parseRegisterAccessPayload } from "@/features/auth/domain/auth-validation";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  getSafeErrorMessage,
  getSafeErrorStatus,
} from "@/lib/safe-error-message";
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

function getCaptchaToken(payload: unknown): string | null {
  const token = String(
    ((payload ?? {}) as Record<string, unknown>).captchaToken ?? "",
  ).trim();

  return token || null;
}

function getRegisterErrorResponse(error: unknown): {
  message: string;
  status: number;
} {
  return {
    message: getSafeErrorMessage(error, {
      fallbackMessage: "Pengajuan akses belum bisa diproses.",
      internalMessage:
        "Pengajuan akses belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti atau hubungi administrator.",
    }),
    status: getSafeErrorStatus(error),
  };
}

export async function POST(request: NextRequest) {
  if (!isAccessRequestEnabled()) {
    return jsonError("Pengajuan akses sedang ditutup.", 403);
  }

  try {
    const rateLimit = await checkRateLimit({
      key: `register:${getClientKey(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak pengajuan. Coba lagi nanti.",
        rateLimit.retryAfterSeconds,
      );
    }

    const rawPayload = await request.json();
    const captcha = await verifyCaptchaToken({
      token: getCaptchaToken(rawPayload),
      remoteIp: getClientKey(request),
    });

    if (!captcha.ok) {
      return jsonError(captcha.error, 400);
    }

    const payload = {
      ...parseRegisterAccessPayload(rawPayload),
      requestedRole: "user" as const,
    };
    await submitAccessRequest(payload, request);

    return jsonOk({
      status: "pending",
      message:
        "Pengajuan akses diterima. Administrator akan meninjau sebelum akun aktif.",
    });
  } catch (error) {
    const response = getRegisterErrorResponse(error);

    return jsonError(response.message, response.status);
  }
}
