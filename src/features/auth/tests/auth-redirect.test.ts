import { describe, expect, it } from "vitest";

import {
  buildDashboardNextPath,
  buildLoginRedirectPath,
  getSafeLoginRedirectPath,
  isDashboardPath,
} from "../lib/auth-redirect";

describe("auth redirect helpers", () => {
  it("allows dashboard redirect paths only", () => {
    expect(getSafeLoginRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeLoginRedirectPath("/dashboard/tanks/tank-1?range=7d")).toBe(
      "/dashboard/tanks/tank-1?range=7d",
    );
    expect(getSafeLoginRedirectPath("https://evil.example/dashboard")).toBe(
      "/dashboard",
    );
    expect(getSafeLoginRedirectPath("javascript:alert(1)")).toBe(
      "/dashboard",
    );
    expect(getSafeLoginRedirectPath("/api/ready")).toBe("/dashboard");
  });

  it("builds login path with an encoded safe next parameter", () => {
    expect(buildLoginRedirectPath("/dashboard?range=30d")).toBe(
      "/login?next=%2Fdashboard%3Frange%3D30d",
    );
  });

  it("normalizes proxy dashboard path and search", () => {
    expect(buildDashboardNextPath("/dashboard/tanks/tank-1", "?range=1d")).toBe(
      "/dashboard/tanks/tank-1?range=1d",
    );
    expect(buildDashboardNextPath("/login", "?next=/dashboard")).toBe(
      "/dashboard",
    );
  });

  it("recognizes dashboard routes", () => {
    expect(isDashboardPath("/dashboard")).toBe(true);
    expect(isDashboardPath("/dashboard/contact")).toBe(true);
    expect(isDashboardPath("/dashboardish")).toBe(false);
  });
});
