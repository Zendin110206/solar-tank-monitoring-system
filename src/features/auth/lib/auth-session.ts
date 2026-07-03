import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import type { AuthSessionUser } from "../types";
import {
  getAuthCookieName,
  shouldUseSecureCookies,
} from "./auth-config";
import { getSessionUserFromToken, logoutSession } from "./auth-service";

export async function getCurrentSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getAuthCookieName())?.value;

  return getSessionUserFromToken(sessionToken);
}

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

export async function revokeCurrentSession() {
  const currentUser = await getCurrentSessionUser();

  if (currentUser) {
    await logoutSession(currentUser.sessionId);
  }

  const cookieStore = await cookies();
  cookieStore.delete(getAuthCookieName());
}
