import type { NextRequest } from "next/server";

import { requireApiUser } from "@/features/auth/server/auth-guards";
import { changePasswordForSession } from "@/features/auth/server/auth-service";
import { parseChangePasswordPayload } from "@/features/auth/domain/auth-validation";
import { checkRateLimit } from "@/features/auth/server/rate-limit";
import {
  jsonCaughtError,
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

  try {
    const rateLimit = await checkRateLimit({
      key: `change-password:${auth.user.id}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return jsonTooManyRequests(
        "Terlalu banyak percobaan. Coba lagi nanti.",
        rateLimit.retryAfterSeconds,
      );
    }

    await changePasswordForSession({
      user: auth.user,
      payload: parseChangePasswordPayload(await request.json()),
      request,
    });

    return jsonOk({
      message: "Kata sandi berhasil diganti. Sesi lain sudah dicabut.",
    });
  } catch (error) {
    return jsonCaughtError(error, {
      fallbackMessage: "Kata sandi belum bisa diganti.",
      internalMessage:
        "Kata sandi belum bisa diganti karena layanan sedang disiapkan. Coba lagi nanti.",
    });
  }
}
