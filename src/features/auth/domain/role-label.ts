import type { AuthSafeUser } from "../types/auth";

// Label peran untuk tampilan profil.

export function getRoleLabel(role: AuthSafeUser["role"]) {
  return role === "admin" ? "Admin" : "User";
}
