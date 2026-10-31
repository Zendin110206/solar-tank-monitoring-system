import type { NextRequest } from "next/server";

// Pembantu membaca permintaan HTTP di route handler.

// IP klien dari header proxy (alamat pertama di X-Forwarded-For, lalu X-Real-IP).
export function getRequestIp(
  request: Pick<NextRequest, "headers">,
): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export function getStringPayloadValue(
  payload: unknown,
  key: string,
): string | null {
  const value = String(
    ((payload ?? {}) as Record<string, unknown>)[key] ?? "",
  ).trim();

  return value || null;
}

export function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}
