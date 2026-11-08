import "server-only";

import {
  type AuthSafeUser,
  type AuthSessionSummary,
  type AuthSessionUser,
} from "../../../types/auth";
import { createAuthId } from "../../auth-crypto";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";
import { type AuthUserRow, rowToSafeUser, toIso, toRequiredIso } from "./rows";

type AuthSessionRow = AuthUserRow & {
  session_id: string;
  session_expires_at: Date;
  session_revoked_at: Date | null;
};

type AuthSessionSummaryRow = RowDataPacket & {
  id: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  last_seen_at: Date;
  created_at: Date;
};

function rowToSessionUser(row: AuthSessionRow): AuthSessionUser {
  return {
    ...rowToSafeUser(row),
    sessionId: row.session_id,
  };
}

function rowToSessionSummary(
  row: AuthSessionSummaryRow,
  currentSessionId: string | null,
): AuthSessionSummary {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: toRequiredIso(row.created_at),
    lastSeenAt: toRequiredIso(row.last_seen_at),
    expiresAt: toRequiredIso(row.expires_at),
    revokedAt: toIso(row.revoked_at),
    current: row.id === currentSessionId,
  };
}

export async function findAuthSessionByTokenHash(
  sessionTokenHash: string,
): Promise<AuthSessionUser | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthSessionRow[]>(
    `SELECT s.id AS session_id, s.expires_at AS session_expires_at,
            s.revoked_at AS session_revoked_at,
            u.id, u.email, u.username, u.full_name, u.phone, u.role, u.status,
            u.password_hash, u.password_changed_at, u.password_reset_required_at,
            u.email_verified_at, u.telegram_chat_id, u.telegram_verified_at,
            u.failed_login_count, u.locked_until, u.last_login_at
       FROM auth_sessions s
       JOIN auth_users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > UTC_TIMESTAMP(3)
      LIMIT 1`,
    [sessionTokenHash],
  );
  const row = rows[0];

  if (!row || row.status !== "active") {
    return null;
  }

  return rowToSessionUser(row);
}

export async function createAuthSession({
  user,
  sessionTokenHash,
  expiresAt,
  ipHash,
  userAgentHash,
}: {
  user: AuthSafeUser;
  sessionTokenHash: string;
  expiresAt: Date;
  ipHash: string | null;
  userAgentHash: string | null;
}): Promise<string> {
  const pool = getMysqlPool();
  const sessionId = createAuthId("sess");
  const now = new Date();

  await pool.execute(
    `INSERT INTO auth_sessions
      (id, user_id, session_token_hash, expires_at, last_seen_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      user.id,
      sessionTokenHash,
      expiresAt,
      now,
      ipHash,
      userAgentHash,
    ],
  );

  await pool.execute(
    `UPDATE auth_users
        SET last_login_at = UTC_TIMESTAMP(3),
            failed_login_count = 0,
            locked_until = NULL
      WHERE id = ?`,
    [user.id],
  );

  return sessionId;
}

export async function revokeAuthSession(sessionId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
      WHERE id = ? AND revoked_at IS NULL`,
    [sessionId],
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
      WHERE user_id = ? AND revoked_at IS NULL`,
    [userId],
  );
}

export async function revokeOtherUserSessions({
  userId,
  currentSessionId,
}: {
  userId: string;
  currentSessionId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND id <> ?
        AND revoked_at IS NULL`,
    [userId, currentSessionId],
  );
}

export async function revokeAuthSessionForUser({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
      WHERE id = ?
        AND user_id = ?
        AND revoked_at IS NULL`,
    [sessionId, userId],
  );
}

export async function listAuthSessionsForUser({
  userId,
  currentSessionId,
}: {
  userId: string;
  currentSessionId: string | null;
}): Promise<AuthSessionSummary[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthSessionSummaryRow[]>(
    `SELECT id, user_id, expires_at, revoked_at, last_seen_at, created_at
       FROM auth_sessions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50`,
    [userId],
  );

  return rows.map((row) => rowToSessionSummary(row, currentSessionId));
}

export async function touchAuthSessionIfStale({
  sessionId,
  staleBefore,
}: {
  sessionId: string;
  staleBefore: Date;
}): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_sessions
        SET last_seen_at = UTC_TIMESTAMP(3)
      WHERE id = ?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP(3)
        AND last_seen_at < ?`,
    [sessionId, staleBefore],
  );
}
