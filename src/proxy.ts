import { NextResponse, type NextRequest } from "next/server";
import {
  buildDashboardNextPath,
  buildLoginRedirectPath,
} from "@/features/auth/lib/auth-redirect";

const AUTH_COOKIE_NAME =
  process.env.AUTH_SESSION_COOKIE_NAME?.trim() || "solar_tank_session";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const dashboardNextPath = buildDashboardNextPath(
    request.nextUrl.pathname,
    request.nextUrl.search,
  );

  if (!sessionCookie && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL(
      buildLoginRedirectPath(dashboardNextPath),
      request.nextUrl,
    );

    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-solar-tank-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-solar-tank-search", request.nextUrl.search);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
