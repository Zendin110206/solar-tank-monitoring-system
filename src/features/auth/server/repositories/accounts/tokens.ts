import "server-only";

import { createAuthId } from "../../auth-crypto";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type RowDataPacket } from "mysql2/promise";
import { type AuthTokenRow } from "./rows";

type AuthOtpRow = RowDataPacket & {
  id: string;
  user_id: string | null;
  access_request_id: string | null;
  purpose: string;
  channel: string;
  destination_hash: string;
  code_hash: string;
  expires_at: Date;
  attempt_count: number;
  max_attempts: number;
  used_at: Date | null;
};

export async function createOtpCodeRecord({
  userId,
  purpose,
  channel,
  destinationHash,
  codeHash,
  expiresAt,
}: {
  userId: string;
  purpose: "login_admin_2fa";
  channel: "email";
  destinationHash: string;
  codeHash: string;
  expiresAt: Date;
}): Promise<string> {
  const pool = getMysqlPool();
  const otpId = createAuthId("otp");

  await pool.execute(
    `UPDATE auth_otp_codes
        SET used_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND purpose = ?
        AND used_at IS NULL`,
    [userId, purpose],
  );

  await pool.execute(
    `INSERT INTO auth_otp_codes
      (id, user_id, purpose, channel, destination_hash, code_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [otpId, userId, purpose, channel, destinationHash, codeHash, expiresAt],
  );

  return otpId;
}

export async function findOtpCodeRecord(
  otpId: string,
): Promise<AuthOtpRow | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthOtpRow[]>(
    `SELECT id, user_id, access_request_id, purpose, channel, destination_hash,
            code_hash, expires_at, attempt_count, max_attempts, used_at
       FROM auth_otp_codes
      WHERE id = ?
      LIMIT 1`,
    [otpId],
  );

  return rows[0] ?? null;
}

export async function markOtpAttempt(otpId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_otp_codes
        SET attempt_count = attempt_count + 1
      WHERE id = ?`,
    [otpId],
  );
}

export async function markOtpUsed(otpId: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_otp_codes
        SET used_at = UTC_TIMESTAMP(3)
      WHERE id = ? AND used_at IS NULL`,
    [otpId],
  );
}

export async function createPasswordResetTokenRecord({
  userId,
  tokenHash,
  destinationHash,
  expiresAt,
  ipHash,
  userAgentHash,
}: {
  userId: string;
  tokenHash: string;
  destinationHash: string;
  expiresAt: Date;
  ipHash: string | null;
  userAgentHash: string | null;
}): Promise<string> {
  const pool = getMysqlPool();
  const tokenId = createAuthId("prt");

  await pool.execute(
    `UPDATE auth_password_reset_tokens
        SET used_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND used_at IS NULL`,
    [userId],
  );

  await pool.execute(
    `INSERT INTO auth_password_reset_tokens
      (id, user_id, token_hash, destination_hash, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tokenId,
      userId,
      tokenHash,
      destinationHash,
      expiresAt,
      ipHash,
      userAgentHash,
    ],
  );

  return tokenId;
}

export async function findPasswordResetTokenRecord(
  tokenHash: string,
): Promise<AuthTokenRow | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthTokenRow[]>(
    `SELECT id, user_id, token_hash, destination_hash, expires_at, used_at
       FROM auth_password_reset_tokens
      WHERE token_hash = ?
      LIMIT 1`,
    [tokenHash],
  );

  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(
  tokenId: string,
): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_password_reset_tokens
        SET used_at = UTC_TIMESTAMP(3)
      WHERE id = ? AND used_at IS NULL`,
    [tokenId],
  );
}

export async function createEmailVerificationTokenRecord({
  userId,
  tokenHash,
  destinationHash,
  expiresAt,
  ipHash,
  userAgentHash,
}: {
  userId: string;
  tokenHash: string;
  destinationHash: string;
  expiresAt: Date;
  ipHash: string | null;
  userAgentHash: string | null;
}): Promise<string> {
  const pool = getMysqlPool();
  const tokenId = createAuthId("evt");

  await pool.execute(
    `UPDATE auth_email_verification_tokens
        SET used_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND used_at IS NULL`,
    [userId],
  );

  await pool.execute(
    `INSERT INTO auth_email_verification_tokens
      (id, user_id, token_hash, destination_hash, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tokenId,
      userId,
      tokenHash,
      destinationHash,
      expiresAt,
      ipHash,
      userAgentHash,
    ],
  );

  return tokenId;
}

export async function findEmailVerificationTokenRecord(
  tokenHash: string,
): Promise<AuthTokenRow | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AuthTokenRow[]>(
    `SELECT id, user_id, token_hash, destination_hash, expires_at, used_at
       FROM auth_email_verification_tokens
      WHERE token_hash = ?
      LIMIT 1`,
    [tokenHash],
  );

  return rows[0] ?? null;
}

export async function markEmailVerificationTokenUsed(
  tokenId: string,
): Promise<void> {
  const pool = getMysqlPool();
  await pool.execute(
    `UPDATE auth_email_verification_tokens
        SET used_at = UTC_TIMESTAMP(3)
      WHERE id = ? AND used_at IS NULL`,
    [tokenId],
  );
}
