import { NextResponse, type NextRequest } from "next/server";

import { verifyCaptchaToken } from "@/features/auth/lib/auth-captcha";
import { isAccessRequestEnabled } from "@/features/auth/lib/auth-config";
import { submitAccessRequest } from "@/features/auth/lib/auth-service";
import { parseRegisterAccessPayload } from "@/features/auth/lib/auth-validation";
import { checkRateLimit } from "@/features/auth/lib/rate-limit";
import {
  getSafeErrorMessage,
  getSafeErrorStatus,
} from "@/lib/safe-error-message";

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
    return NextResponse.json(
      { ok: false, error: "Pengajuan akses sedang ditutup." },
      { status: 403 },
    );
  }

  try {
    const rateLimit = await checkRateLimit({
      key: `register:${getClientKey(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Terlalu banyak pengajuan. Coba lagi nanti.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const rawPayload = await request.json();
    const captcha = await verifyCaptchaToken({
      token: getCaptchaToken(rawPayload),
      remoteIp: getClientKey(request),
    });

    if (!captcha.ok) {
      return NextResponse.json(
        { ok: false, error: captcha.error },
        { status: 400 },
      );
    }

    const payload = {
      ...parseRegisterAccessPayload(rawPayload),
      requestedRole: "user" as const,
    };
    await submitAccessRequest(payload, request);

    return NextResponse.json({
      ok: true,
      data: {
        status: "pending",
        message:
          "Pengajuan akses diterima. Administrator akan meninjau sebelum akun aktif.",
      },
    });
  } catch (error) {
    const response = getRegisterErrorResponse(error);

    return NextResponse.json(
      {
        ok: false,
        error: response.message,
      },
      { status: response.status },
    );
  }
}
