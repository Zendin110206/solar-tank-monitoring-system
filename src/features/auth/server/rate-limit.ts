import "server-only";

import { recordRateLimitRequest } from "./repositories/mysql-rate-limit-repository";

export type RateLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const bucket = await recordRateLimitRequest(key, windowSeconds);

  if (!bucket || bucket.request_count <= limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((bucket.window_expires_at.getTime() - Date.now()) / 1000),
    ),
  };
}
