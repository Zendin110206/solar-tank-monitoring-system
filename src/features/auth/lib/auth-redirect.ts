const LOCAL_ORIGIN = "https://solar-tank.local";
const DASHBOARD_FALLBACK_PATH = "/dashboard";

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function getSafeLoginRedirectPath(value: string | null | undefined) {
  if (!value) {
    return DASHBOARD_FALLBACK_PATH;
  }

  try {
    const parsed = new URL(value, LOCAL_ORIGIN);

    if (parsed.origin !== LOCAL_ORIGIN || !isDashboardPath(parsed.pathname)) {
      return DASHBOARD_FALLBACK_PATH;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DASHBOARD_FALLBACK_PATH;
  }
}

export function buildDashboardNextPath(
  pathname: string | null | undefined,
  search = "",
) {
  if (!pathname || !isDashboardPath(pathname)) {
    return DASHBOARD_FALLBACK_PATH;
  }

  return getSafeLoginRedirectPath(`${pathname}${search}`);
}

export function buildLoginRedirectPath(nextPath: string | null | undefined) {
  const params = new URLSearchParams({
    next: getSafeLoginRedirectPath(nextPath),
  });

  return `/login?${params.toString()}`;
}
