import { timingSafeEqual } from "node:crypto";

import { hmacSha256Hex } from "./auth-crypto";

const ADMIN_ACTION_SCOPE = "admin-action";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createAdminActionCsrfToken(sessionId: string): string {
  return `v1.${hmacSha256Hex(`${ADMIN_ACTION_SCOPE}:${sessionId}`)}`;
}

export function verifyAdminActionCsrfToken({
  sessionId,
  token,
}: {
  sessionId: string;
  token: string | null;
}): boolean {
  if (!token?.startsWith("v1.")) {
    return false;
  }

  return safeEqual(token, createAdminActionCsrfToken(sessionId));
}
