export const AUTH_ROLES = ["user", "admin"] as const;
export const AUTH_USER_STATUSES = [
  "pending",
  "active",
  "suspended",
  "disabled",
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type AuthUserStatus = (typeof AUTH_USER_STATUSES)[number];

export type AuthSafeUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: AuthRole;
  status: AuthUserStatus;
  emailVerifiedAt: string | null;
  telegramVerifiedAt: string | null;
  passwordChangedAt: string | null;
  lastLoginAt: string | null;
};

export type AuthSessionUser = AuthSafeUser & {
  sessionId: string;
};

export type AuthAccessRequest = {
  id: string;
  user: AuthSafeUser;
  requestedRole: AuthRole;
  accessReason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type AuthAuditEvent = {
  id: string;
  actorUserId: string | null;
  eventType: string;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuthSessionSummary = {
  id: string;
  userId: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  current: boolean;
};

export function isAuthRole(value: string): value is AuthRole {
  return AUTH_ROLES.includes(value as AuthRole);
}

export function isAuthUserStatus(value: string): value is AuthUserStatus {
  return AUTH_USER_STATUSES.includes(value as AuthUserStatus);
}

export function isAdmin(user: Pick<AuthSafeUser, "role">): boolean {
  return user.role === "admin";
}
