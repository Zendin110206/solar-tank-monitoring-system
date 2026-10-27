import "server-only";

import {
  type AuthAccessRequest,
  type AuthRole,
  isAuthRole,
  isAuthUserStatus,
} from "../../../types/auth";
import { shouldRequireEmailVerificationForApproval } from "../../auth-config";
import { createAuthId, hashPassword } from "../../auth-crypto";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";
import { type AuthUserRow, toIso, toRequiredIso } from "./rows";

type AuthAccessRequestRow = RowDataPacket & {
  request_id: string;
  requested_role: string;
  request_status: string;
  access_reason: string | null;
  review_note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  role: string;
  user_status: string;
  email_verified_at: Date | null;
  telegram_verified_at: Date | null;
  password_changed_at: Date | null;
  last_login_at: Date | null;
};

function rowToAccessRequest(row: AuthAccessRequestRow): AuthAccessRequest {
  return {
    id: row.request_id,
    user: {
      id: row.user_id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      phone: row.phone,
      role: isAuthRole(row.role) ? row.role : "user",
      status: isAuthUserStatus(row.user_status) ? row.user_status : "pending",
      emailVerifiedAt: toIso(row.email_verified_at),
      telegramVerifiedAt: toIso(row.telegram_verified_at),
      passwordChangedAt: toIso(row.password_changed_at),
      lastLoginAt: toIso(row.last_login_at),
    },
    requestedRole: isAuthRole(row.requested_role) ? row.requested_role : "user",
    accessReason: row.access_reason,
    status:
      row.request_status === "approved" ||
      row.request_status === "rejected" ||
      row.request_status === "cancelled"
        ? row.request_status
        : "pending",
    reviewNote: row.review_note,
    reviewedAt: toIso(row.reviewed_at),
    createdAt: toRequiredIso(row.created_at),
  };
}

export async function createPendingAccessRequest({
  fullName,
  username,
  email,
  phone,
  password,
  requestedRole,
  accessReason,
}: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  requestedRole: AuthRole;
  accessReason: string | null;
}): Promise<{
  userId: string;
  accessRequestId: string;
  created: boolean;
  email: string;
}> {
  const pool = getMysqlPool();
  const [existingRows] = await pool.execute<AuthUserRow[]>(
    `SELECT id, email, username, full_name, phone, role, status, password_hash,
            password_changed_at, password_reset_required_at, email_verified_at,
            telegram_chat_id, telegram_verified_at, failed_login_count,
            locked_until, last_login_at
       FROM auth_users
      WHERE email = ? OR username = ?
      LIMIT 1`,
    [email, username],
  );
  const existing = existingRows[0];

  if (existing) {
    const [requestRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id
         FROM auth_access_requests
        WHERE user_id = ? AND status = 'pending'
        LIMIT 1`,
      [existing.id],
    );

    return {
      userId: existing.id,
      accessRequestId: String(requestRows[0]?.id ?? ""),
      created: false,
      email: existing.email,
    };
  }

  const userId = createAuthId("usr");
  const accessRequestId = createAuthId("req");
  const passwordHash = await hashPassword(password);

  await pool.execute(
    `INSERT INTO auth_users
      (id, email, username, full_name, phone, role, status, password_hash, password_changed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, UTC_TIMESTAMP(3))`,
    [userId, email, username, fullName, phone, requestedRole, passwordHash],
  );

  await pool.execute(
    `INSERT INTO auth_access_requests
      (id, user_id, requested_role, access_reason, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [accessRequestId, userId, requestedRole, accessReason],
  );

  return { userId, accessRequestId, created: true, email };
}

export async function listPendingAccessRequests(): Promise<
  AuthAccessRequest[]
> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthAccessRequestRow[]>(
    `SELECT r.id AS request_id, r.requested_role, r.status AS request_status,
            r.access_reason, r.review_note, r.reviewed_at, r.created_at,
            u.id AS user_id, u.email, u.username, u.full_name, u.phone,
            u.role, u.status AS user_status, u.email_verified_at,
            u.telegram_verified_at, u.password_changed_at, u.last_login_at
       FROM auth_access_requests r
       JOIN auth_users u ON u.id = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
      LIMIT 100`,
  );

  return rows.map(rowToAccessRequest);
}

export async function approveAccessRequest({
  accessRequestId,
  adminUserId,
}: {
  accessRequestId: string;
  adminUserId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT user_id, requested_role, u.email_verified_at
         FROM auth_access_requests
         JOIN auth_users u ON u.id = auth_access_requests.user_id
        WHERE auth_access_requests.id = ?
          AND auth_access_requests.status = 'pending'
        FOR UPDATE`,
      [accessRequestId],
    );
    const row = rows[0] as
      | {
          user_id: string;
          requested_role: string;
          email_verified_at: Date | null;
        }
      | undefined;

    if (!row || !isAuthRole(row.requested_role)) {
      throw new Error("Pengajuan akses tidak ditemukan.");
    }

    if (shouldRequireEmailVerificationForApproval() && !row.email_verified_at) {
      throw new Error(
        "Email pengguna belum diverifikasi. Kirim ulang link verifikasi bila perlu.",
      );
    }

    await connection.execute(
      `UPDATE auth_users
          SET status = 'active',
              role = ?,
              email_verified_at = CASE
                WHEN ? = TRUE THEN email_verified_at
                ELSE COALESCE(email_verified_at, UTC_TIMESTAMP(3))
              END
        WHERE id = ?`,
      [
        row.requested_role,
        shouldRequireEmailVerificationForApproval(),
        row.user_id,
      ],
    );

    await connection.execute(
      `UPDATE auth_access_requests
          SET status = 'approved',
              reviewed_by_user_id = ?,
              reviewed_at = UTC_TIMESTAMP(3)
        WHERE id = ?`,
      [adminUserId, accessRequestId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function rejectAccessRequest({
  accessRequestId,
  adminUserId,
}: {
  accessRequestId: string;
  adminUserId: string;
}): Promise<void> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT user_id
         FROM auth_access_requests
        WHERE id = ? AND status = 'pending'
        FOR UPDATE`,
      [accessRequestId],
    );
    const row = rows[0] as { user_id: string } | undefined;

    if (!row) {
      throw new Error("Pengajuan akses tidak ditemukan.");
    }

    await connection.execute(
      `UPDATE auth_users
          SET status = 'disabled'
        WHERE id = ?`,
      [row.user_id],
    );

    await connection.execute(
      `UPDATE auth_access_requests
          SET status = 'rejected',
              reviewed_by_user_id = ?,
              reviewed_at = UTC_TIMESTAMP(3)
        WHERE id = ?`,
      [adminUserId, accessRequestId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
