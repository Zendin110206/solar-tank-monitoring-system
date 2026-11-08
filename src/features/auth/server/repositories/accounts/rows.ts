import "server-only";

import {
  type AuthSafeUser,
  type AuthUserStatus,
  isAuthRole,
  isAuthUserStatus,
} from "../../../types/auth";
import { type RowDataPacket } from "mysql2/promise";

export type AuthUserRow = RowDataPacket & {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  password_hash: string;
  password_changed_at: Date | null;
  password_reset_required_at: Date | null;
  email_verified_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  telegram_chat_id: string | null;
  telegram_verified_at: Date | null;
};

export type AuthTokenRow = RowDataPacket & {
  id: string;
  user_id: string;
  token_hash: string;
  destination_hash?: string;
  expires_at: Date;
  used_at: Date | null;
  chat_id?: string | null;
};

export function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsedTime = Date.parse(value);

  if (!Number.isFinite(parsedTime)) {
    return null;
  }

  return new Date(parsedTime).toISOString();
}

export function toRequiredIso(value: Date | string): string {
  const isoValue = toIso(value);

  if (!isoValue) {
    throw new Error("Timestamp auth dari MySQL tidak valid.");
  }

  return isoValue;
}

export function rowToSafeUser(row: AuthUserRow): AuthSafeUser {
  const role = isAuthRole(row.role) ? row.role : "user";
  const status: AuthUserStatus = isAuthUserStatus(row.status)
    ? row.status
    : "pending";

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone,
    role,
    status,
    emailVerifiedAt: toIso(row.email_verified_at),
    telegramVerifiedAt: toIso(row.telegram_verified_at),
    passwordChangedAt: toIso(row.password_changed_at),
    lastLoginAt: toIso(row.last_login_at),
  };
}
