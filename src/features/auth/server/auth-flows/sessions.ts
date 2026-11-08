import "server-only";

import {
  type AuthSessionSummary,
  type AuthSessionUser,
} from "../../types/auth";
import {
  listAuthSessionsForUser,
  recordAuthAuditEvent,
  revokeAuthSessionForUser,
} from "../repositories/mysql-auth-repository";

export async function listCurrentUserSessions({
  user,
}: {
  user: AuthSessionUser;
}): Promise<AuthSessionSummary[]> {
  return listAuthSessionsForUser({
    userId: user.id,
    currentSessionId: user.sessionId,
  });
}

export async function revokeCurrentUserSessionById({
  user,
  sessionId,
}: {
  user: AuthSessionUser;
  sessionId: string;
}): Promise<void> {
  if (sessionId === user.sessionId) {
    throw new Error("Sesi aktif dicabut lewat tombol keluar.");
  }

  await revokeAuthSessionForUser({
    userId: user.id,
    sessionId,
  });
  await recordAuthAuditEvent({
    eventType: "own_session_revoked",
    actorUserId: user.id,
    targetUserId: user.id,
    metadata: { sessionId },
  }).catch(() => undefined);
}
