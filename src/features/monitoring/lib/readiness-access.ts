import { timingSafeEqual } from "node:crypto";

const READINESS_TOKEN_HEADER = "x-solar-tank-readiness-token";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getProvidedReadinessToken(headers: Headers): string | null {
  const headerToken = headers.get(READINESS_TOKEN_HEADER)?.trim();

  if (headerToken) {
    return headerToken;
  }

  const authorization = headers.get("authorization")?.trim();
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization ?? "");

  return bearerMatch?.[1]?.trim() || null;
}

export function hasValidReadinessToken({
  expectedToken,
  headers,
}: {
  expectedToken: string | null;
  headers: Headers;
}) {
  if (!expectedToken) {
    return false;
  }

  const providedToken = getProvidedReadinessToken(headers);

  return Boolean(providedToken && safeEqual(providedToken, expectedToken));
}
