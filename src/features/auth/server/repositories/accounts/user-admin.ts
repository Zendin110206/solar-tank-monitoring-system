import "server-only";

import {
  type AuthRole,
  type AuthSafeUser,
  type AuthUserStatus,
  isAuthRole,
  isAuthUserStatus,
} from "../../../types/auth";
import { shouldRequireEmailVerificationForApproval } from "../../auth-config";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type PoolConnection, type RowDataPacket } from "mysql2/promise";
import { type AuthUserRow, rowToSafeUser, toRequiredIso } from "./rows";

type AuthUserLifecycleRow = RowDataPacket & {
  id: string;
  role: string;
  status: string;
  email_verified_at: Date | null;
};

type AuthUserDirectoryRow = AuthUserRow & {
  created_at: Date;
};

type AuthUserCountRow = RowDataPacket & {
  count: number;
};

type AuthUserSummaryRow = RowDataPacket & {
  total_count: number;
  active_count: number;
  pending_count: number;
  suspended_count: number;
  disabled_count: number;
  admin_count: number;
  unverified_count: number;
};

type AuthUserDeleteRow = RowDataPacket & {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  email_verified_at: Date | null;
};

export type AuthUserDirectoryItem = AuthSafeUser & {
  createdAt: string;
};

export type AuthUserDirectoryFilters = {
  page?: number;
  pageSize?: number;
  query?: string;
  role?: AuthRole | "all";
  sort?: "created_desc" | "last_login_desc" | "name_asc";
  status?: AuthUserStatus | "all";
  verification?: "all" | "unverified" | "verified";
};

export type AuthUserDirectoryResult = {
  counts: {
    active: number;
    admin: number;
    disabled: number;
    pending: number;
    suspended: number;
    total: number;
    unverified: number;
  };
  filteredCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  users: AuthUserDirectoryItem[];
};

export type DeletedAuthUserSummary = {
  email: string;
  fullName: string;
  id: string;
  role: AuthRole;
  status: AuthUserStatus;
  username: string;
};

const DEFAULT_AUTH_USER_PAGE_SIZE = 10;

const MAX_AUTH_USER_PAGE_SIZE = 50;

function rowToDirectoryUser(row: AuthUserDirectoryRow): AuthUserDirectoryItem {
  return {
    ...rowToSafeUser(row),
    createdAt: toRequiredIso(row.created_at),
  };
}

async function findAuthUserLifecycleForUpdate(
  connection: PoolConnection,
  userId: string,
): Promise<{
  id: string;
  role: AuthRole;
  status: AuthUserStatus;
  emailVerifiedAt: Date | null;
}> {
  const [rows] = await connection.execute<AuthUserLifecycleRow[]>(
    `SELECT id, role, status, email_verified_at
       FROM auth_users
      WHERE id = ?
      LIMIT 1
      FOR UPDATE`,
    [userId],
  );
  const row = rows[0];

  if (!row || !isAuthRole(row.role) || !isAuthUserStatus(row.status)) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  return {
    id: row.id,
    role: row.role,
    status: row.status,
    emailVerifiedAt: row.email_verified_at,
  };
}

async function assertActiveAdminCanChange({
  connection,
  target,
  nextRole,
  nextStatus,
}: {
  connection: PoolConnection;
  target: { id: string; role: AuthRole; status: AuthUserStatus };
  nextRole: AuthRole;
  nextStatus: AuthUserStatus;
}): Promise<void> {
  const targetKeepsActiveAdmin =
    target.role !== "admin" ||
    target.status !== "active" ||
    (nextRole === "admin" && nextStatus === "active");

  if (targetKeepsActiveAdmin) {
    return;
  }

  const [rows] = await connection.execute<AuthUserLifecycleRow[]>(
    `SELECT id, role, status
       FROM auth_users
      WHERE role = 'admin'
        AND status = 'active'
      FOR UPDATE`,
  );
  const remainingActiveAdmins = rows.filter((row) => row.id !== target.id);

  if (remainingActiveAdmins.length < 1) {
    throw new Error("Minimal harus ada satu admin aktif.");
  }
}

async function revokeAllUserSessionsWithConnection(
  connection: PoolConnection,
  userId: string,
): Promise<void> {
  await connection.execute(
    `UPDATE auth_sessions
        SET revoked_at = UTC_TIMESTAMP(3)
      WHERE user_id = ? AND revoked_at IS NULL`,
    [userId],
  );
}

export async function updateAuthUserRole({
  targetUserId,
  role,
}: {
  targetUserId: string;
  role: AuthRole;
}): Promise<void> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const target = await findAuthUserLifecycleForUpdate(
      connection,
      targetUserId,
    );

    if (target.status === "pending") {
      throw new Error("Pengguna pending harus diproses dari pengajuan akses.");
    }

    if (
      target.status === "active" &&
      shouldRequireEmailVerificationForApproval() &&
      !target.emailVerifiedAt
    ) {
      throw new Error("Email pengguna belum diverifikasi.");
    }

    await assertActiveAdminCanChange({
      connection,
      target,
      nextRole: role,
      nextStatus: target.status,
    });

    await connection.execute(
      `UPDATE auth_users
          SET role = ?
        WHERE id = ?`,
      [role, targetUserId],
    );

    if (target.role !== role) {
      await revokeAllUserSessionsWithConnection(connection, targetUserId);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setAuthUserStatus({
  targetUserId,
  status,
}: {
  targetUserId: string;
  status: AuthUserStatus;
}): Promise<void> {
  if (status === "pending") {
    throw new Error("Status pending hanya untuk pengajuan akses baru.");
  }

  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const target = await findAuthUserLifecycleForUpdate(
      connection,
      targetUserId,
    );

    if (target.status === "pending") {
      throw new Error("Pengguna pending harus diproses dari pengajuan akses.");
    }

    await assertActiveAdminCanChange({
      connection,
      target,
      nextRole: target.role,
      nextStatus: status,
    });

    await connection.execute(
      `UPDATE auth_users
          SET status = ?,
              email_verified_at = CASE
                WHEN ? = 'active' THEN COALESCE(email_verified_at, UTC_TIMESTAMP(3))
                ELSE email_verified_at
              END,
              failed_login_count = CASE
                WHEN ? = 'active' THEN 0
                ELSE failed_login_count
              END,
              locked_until = CASE
                WHEN ? = 'active' THEN NULL
                ELSE locked_until
              END
        WHERE id = ?`,
      [status, status, status, status, targetUserId],
    );

    if (status !== "active") {
      await revokeAllUserSessionsWithConnection(connection, targetUserId);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteAuthUser({
  targetUserId,
}: {
  targetUserId: string;
}): Promise<DeletedAuthUserSummary> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<AuthUserDeleteRow[]>(
      `SELECT id, email, username, full_name, role, status, email_verified_at
         FROM auth_users
        WHERE id = ?
        LIMIT 1
        FOR UPDATE`,
      [targetUserId],
    );
    const row = rows[0];

    if (!row || !isAuthRole(row.role) || !isAuthUserStatus(row.status)) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    await assertActiveAdminCanChange({
      connection,
      target: {
        id: row.id,
        role: row.role,
        status: row.status,
      },
      nextRole: "user",
      nextStatus: "disabled",
    });

    const [deviceRequestRows] = await connection.execute<AuthUserCountRow[]>(
      `SELECT COUNT(*) AS count
         FROM monitoring_device_requests
        WHERE requester_user_id = ?`,
      [targetUserId],
    );

    if (toCount(deviceRequestRows[0]?.count) > 0) {
      throw new Error(
        "Pengguna ini punya pengajuan perangkat. Nonaktifkan akun agar jejak operasional tetap aman.",
      );
    }

    await connection.execute(
      `DELETE FROM auth_access_requests
        WHERE user_id = ?`,
      [targetUserId],
    );

    await connection.execute(
      `DELETE FROM auth_users
        WHERE id = ?`,
      [targetUserId],
    );

    await connection.commit();

    return {
      email: row.email,
      fullName: row.full_name,
      id: row.id,
      role: row.role,
      status: row.status,
      username: row.username,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function getAuthUserDirectoryPageSize(pageSize: number | undefined): number {
  if (!Number.isInteger(pageSize) || !pageSize) {
    return DEFAULT_AUTH_USER_PAGE_SIZE;
  }

  return Math.min(Math.max(pageSize, 1), MAX_AUTH_USER_PAGE_SIZE);
}

function getAuthUserDirectoryPage(page: number | undefined): number {
  if (!Number.isInteger(page) || !page || page < 1) {
    return 1;
  }

  return page;
}

function getAuthUserDirectoryWhere({
  query,
  role,
  status,
  verification,
}: AuthUserDirectoryFilters): {
  values: string[];
  whereSql: string;
} {
  const clauses: string[] = [];
  const values: string[] = [];
  const cleanQuery = String(query ?? "")
    .trim()
    .slice(0, 120);

  if (cleanQuery) {
    const likeQuery = `%${cleanQuery}%`;
    clauses.push(
      `(full_name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?)`,
    );
    values.push(likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (role && role !== "all") {
    clauses.push("role = ?");
    values.push(role);
  }

  if (status && status !== "all") {
    clauses.push("status = ?");
    values.push(status);
  }

  if (verification === "verified") {
    clauses.push("email_verified_at IS NOT NULL");
  } else if (verification === "unverified") {
    clauses.push("email_verified_at IS NULL");
  }

  return {
    values,
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
  };
}

function getAuthUserDirectoryOrder(sort: AuthUserDirectoryFilters["sort"]) {
  switch (sort) {
    case "last_login_desc":
      return "last_login_at IS NULL ASC, last_login_at DESC, created_at DESC";
    case "name_asc":
      return "full_name ASC, email ASC";
    case "created_desc":
    default:
      return "created_at DESC";
  }
}

function toCount(value: unknown): number {
  const count = Number(value);

  return Number.isFinite(count) ? count : 0;
}

export async function listAuthUsersForAdmin(
  filters: AuthUserDirectoryFilters = {},
): Promise<AuthUserDirectoryResult> {
  const pool = getMysqlPool();
  const pageSize = getAuthUserDirectoryPageSize(filters.pageSize);
  const requestedPage = getAuthUserDirectoryPage(filters.page);
  const { values, whereSql } = getAuthUserDirectoryWhere(filters);
  const [summaryRows, countRows] = await Promise.all([
    pool.execute<AuthUserSummaryRow[]>(
      `SELECT
          COUNT(*) AS total_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_count,
          SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) AS disabled_count,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_count,
          SUM(CASE WHEN email_verified_at IS NULL THEN 1 ELSE 0 END) AS unverified_count
         FROM auth_users`,
    ),
    pool.execute<AuthUserCountRow[]>(
      `SELECT COUNT(*) AS count
         FROM auth_users
        ${whereSql}`,
      values,
    ),
  ]);
  const summary = summaryRows[0][0];
  const filteredCount = toCount(countRows[0][0]?.count);
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * pageSize;
  const limitSql = String(pageSize);
  const offsetSql = String(offset);
  const [userRows] = await pool.execute<AuthUserDirectoryRow[]>(
    `SELECT id, email, username, full_name, phone, role, status, password_hash,
            password_changed_at, password_reset_required_at, email_verified_at,
            telegram_chat_id, telegram_verified_at, failed_login_count,
            locked_until, last_login_at, created_at
       FROM auth_users
      ${whereSql}
      ORDER BY ${getAuthUserDirectoryOrder(filters.sort)}
      LIMIT ${limitSql} OFFSET ${offsetSql}`,
    values,
  );

  return {
    counts: {
      active: toCount(summary?.active_count),
      admin: toCount(summary?.admin_count),
      disabled: toCount(summary?.disabled_count),
      pending: toCount(summary?.pending_count),
      suspended: toCount(summary?.suspended_count),
      total: toCount(summary?.total_count),
      unverified: toCount(summary?.unverified_count),
    },
    filteredCount,
    page,
    pageCount,
    pageSize,
    users: userRows.map(rowToDirectoryUser),
  };
}
