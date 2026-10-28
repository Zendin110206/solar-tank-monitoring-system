import "server-only";

import { getAppBaseUrl } from "../auth-config";
import { type NextRequest } from "next/server";

export type AuthRequestContext = Pick<NextRequest, "headers">;

export function getRequestUserAgent(
  request: AuthRequestContext,
): string | null {
  return request.headers.get("user-agent");
}

export function buildAppUrl(
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(path, getAppBaseUrl());

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function buildTokenExpiry(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000);
}

export function isTokenUsable(token: {
  used_at: Date | null;
  expires_at: Date;
}): boolean {
  return !token.used_at && token.expires_at.getTime() > Date.now();
}
