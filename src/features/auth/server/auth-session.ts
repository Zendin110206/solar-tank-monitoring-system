import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import type { NextRequest, NextResponse } from "next/server";

import type { AuthSessionUser } from "../types/auth";
import { getAuthCookieName, shouldUseSecureCookies } from "./auth-config";
import { getSessionUserFromToken } from "./auth-service";

// Dibagi dalam satu permintaan (React cache): layout dashboard dan halaman
// yang sama-sama membaca sesi hanya memeriksa database sekali.
export const getCurrentSessionUser = cache(
  async (): Promise<AuthSessionUser | null> => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getAuthCookieName())?.value;

    return getSessionUserFromToken(sessionToken);
  },
);

export async function getRequestSessionUser(
  request: NextRequest,
): Promise<AuthSessionUser | null> {
  const sessionToken = request.cookies.get(getAuthCookieName())?.value;

  return getSessionUserFromToken(sessionToken);
}

export function setSessionCookie({
  response,
  sessionToken,
  expiresAt,
}: {
  response: NextResponse;
  sessionToken: string;
  expiresAt: Date;
}) {
  response.cookies.set(getAuthCookieName(), sessionToken, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
