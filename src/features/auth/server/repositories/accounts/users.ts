import "server-only";

import {
  type AuthSafeUser,
  isAuthRole,
  isAuthUserStatus,
} from "../../../types/auth";
import { getLoginLockSeconds, getLoginMaxAttempts } from "../../auth-config";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";
import { type AuthUserRow, rowToSafeUser, toIso } from "./rows";

type VerifiedTelegramUserSummaryRow = RowDataPacket & {
  full_name: string;
  role: string;
  status: string;
  telegram_verified_at: Date;
  username: string;
};

type VerifiedTelegramUserSummary = Pick<
  AuthSafeUser,
  "fullName" | "role" | "status" | "telegramVerifiedAt" | "username"
>;

export async function findAuthUserByIdentity(identity: string): Promise<
  | (AuthSafeUser & {
      passwordHash: string;
      lockedUntil: string | null;
      failedLoginCount: number;
    })
  | null
> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthUserRow[]>(
    `SELECT id, email, username, full_name, phone, role, status, password_hash,
            password_changed_at, password_reset_required_at, email_verified_at,
            telegram_chat_id, telegram_verified_at, failed_login_count,
            locked_until, last_login_at
       FROM auth_users
      WHERE email = ? OR username = ?
      LIMIT 1`,
    [identity, identity],
  );
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...rowToSafeUser(row),
    passwordHash: row.password_hash,
    lockedUntil: toIso(row.locked_until),
    failedLoginCount: row.failed_login_count,
  };
}

export async function findAuthUserById(
  userId: string,
): Promise<AuthSafeUser | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthUserRow[]>(
    `SELECT id, email, username, full_name, phone, role, status, password_hash,
            password_changed_at, password_reset_required_at, email_verified_at,
            telegram_chat_id, telegram_verified_at, failed_login_count,
            locked_until, last_login_at
       FROM auth_users
      WHERE id = ?
      LIMIT 1`,
    [userId],
  );
  const row = rows[0];

  return row ? rowToSafeUser(row) : null;
}

export async function findAuthUserByVerifiedTelegramChatId(
  chatId: string,
): Promise<VerifiedTelegramUserSummary | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<VerifiedTelegramUserSummaryRow[]>(
    `SELECT username, full_name, role, status, telegram_verified_at
       FROM auth_users
      WHERE telegram_chat_id = ?
        AND telegram_verified_at IS NOT NULL
      LIMIT 1`,
    [chatId],
  );
  const row = rows[0];

  if (!row || !isAuthRole(row.role) || !isAuthUserStatus(row.status)) {
    return null;
  }

  return {
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    telegramVerifiedAt: toIso(row.telegram_verified_at),
    username: row.username,
  };
}

export async function recordFailedLogin(userId: string): Promise<void> {
  const pool = getMysqlPool();
  const maxAttempts = getLoginMaxAttempts();
  const lockSeconds = getLoginLockSeconds();

  await pool.execute(
    `UPDATE auth_users
        SET failed_login_count = failed_login_count + 1,
            locked_until = CASE
              WHEN failed_login_count + 1 >= ? THEN DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND)
              ELSE locked_until
            END
      WHERE id = ?`,
    [maxAttempts, lockSeconds, userId],
  );
}

export async function resetFailedLogin(userId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_users
        SET failed_login_count = 0,
            locked_until = NULL
      WHERE id = ?`,
    [userId],
  );
}

export async function updateAuthUserPasswordHash({
  userId,
  passwordHash,
}: {
  userId: string;
  passwordHash: string;
}): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_users
        SET password_hash = ?,
            password_changed_at = UTC_TIMESTAMP(3),
            password_reset_required_at = NULL
      WHERE id = ?`,
    [passwordHash, userId],
  );
}

export async function markAuthUserEmailVerified(userId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_users
        SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP(3))
      WHERE id = ?`,
    [userId],
  );
}

export async function updateAuthUserProfile({
  fullName,
  phone,
  userId,
}: {
  fullName: string;
  phone: string | null;
  userId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_users
        SET full_name = ?,
            phone = ?
      WHERE id = ?`,
    [fullName, phone, userId],
  );
}
