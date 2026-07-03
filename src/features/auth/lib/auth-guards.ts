import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import type { AuthRole, AuthSessionUser } from "../types";
import { getCurrentSessionUser, getRequestSessionUser } from "./auth-session";

export async function requirePageUser(): Promise<AuthSessionUser> {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePageAdmin(): Promise<AuthSessionUser> {
  const user = await requirePageUser();

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return user;
}

export async function requireApiUser(
  request: NextRequest,
  allowedRoles?: AuthRole[],
): Promise<
  | { ok: true; user: AuthSessionUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getRequestSessionUser(request);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Autentikasi diperlukan." },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Akses tidak tersedia untuk peran akun ini." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}
