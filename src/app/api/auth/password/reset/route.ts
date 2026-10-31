import type { NextRequest } from "next/server";

import { resetPasswordWithToken } from "@/features/auth/server/auth-service";
import { parseResetPasswordPayload } from "@/features/auth/domain/auth-validation";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  jsonCaughtError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/http/json-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseResetPasswordPayload(await request.json());
    const rateLimit = await checkRateLimit({
      key: `reset-password:${getClientIp(request)}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak percobaan reset. Coba lagi nanti.",
        rateLimit.retryAfterSeconds,
      );
    }

    await resetPasswordWithToken({ payload, request });

    return jsonOk({
      message:
        "Kata sandi berhasil diganti. Silakan masuk ulang dengan kata sandi baru.",
    });
  } catch (error) {
    return jsonCaughtError(error, {
      fallbackMessage: "Reset kata sandi belum bisa diproses.",
      internalMessage:
        "Reset kata sandi belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
    });
  }
}
