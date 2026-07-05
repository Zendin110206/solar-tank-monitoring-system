import { NextResponse, type NextRequest } from "next/server";

import { verifyEmailToken } from "@/features/auth/lib/auth-service";
import { getSafeErrorMessage } from "@/lib/safe-error-message";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const redirectUrl = new URL("/login", request.url);

  try {
    if (!token) {
      throw new Error("Token verifikasi tidak ditemukan.");
    }

    await verifyEmailToken({ token, request });
    redirectUrl.searchParams.set("verified", "1");
  } catch (error) {
    redirectUrl.searchParams.set("verified", "0");
    redirectUrl.searchParams.set(
      "reason",
      getSafeErrorMessage(error, {
        fallbackMessage: "Verifikasi email gagal.",
        internalMessage:
          "Verifikasi email belum bisa diproses karena layanan sedang disiapkan. Coba lagi nanti.",
      }),
    );
  }

  return NextResponse.redirect(redirectUrl);
}
