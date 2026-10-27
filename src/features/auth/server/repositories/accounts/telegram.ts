import "server-only";

import { createAuthId } from "../../auth-crypto";
import { getMysqlPool } from "@/lib/database/mysql-connection";
import { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { type AuthTokenRow } from "./rows";

export async function createTelegramBindTokenRecord({
  userId,
  tokenHash,
  expiresAt,
  ipHash,
  userAgentHash,
}: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipHash: string | null;
  userAgentHash: string | null;
}): Promise<string> {
  const pool = getMysqlPool();
  const tokenId = createAuthId("tbt");

  await pool.execute(
    `UPDATE auth_telegram_bind_tokens
        SET used_at = UTC_TIMESTAMP(3)
      WHERE user_id = ?
        AND used_at IS NULL`,
    [userId],
  );

  await pool.execute(
    `INSERT INTO auth_telegram_bind_tokens
      (id, user_id, token_hash, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tokenId, userId, tokenHash, expiresAt, ipHash, userAgentHash],
  );

  return tokenId;
}

export async function completeTelegramBindingInMysql({
  tokenHash,
  chatId,
}: {
  tokenHash: string;
  chatId: string;
}): Promise<{ userId: string } | null> {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tokens] = await connection.execute<AuthTokenRow[]>(
      `SELECT id, user_id, token_hash, expires_at, used_at, chat_id
         FROM auth_telegram_bind_tokens
        WHERE token_hash = ?
          AND used_at IS NULL
          AND expires_at > UTC_TIMESTAMP(3)
        LIMIT 1
        FOR UPDATE`,
      [tokenHash],
    );
    const token = tokens[0];

    if (!token) {
      await connection.rollback();
      return null;
    }

    const [conflictingUsers] = await connection.execute<
      Array<RowDataPacket & { id: string }>
    >(
      `SELECT id
         FROM auth_users
        WHERE telegram_chat_id = ?
          AND id <> ?
        LIMIT 1
        FOR UPDATE`,
      [chatId, token.user_id],
    );

    if (conflictingUsers[0]) {
      throw new Error("Telegram ini sudah terhubung ke akun FTM lain.");
    }

    const [userUpdate] = await connection.execute<ResultSetHeader>(
      `UPDATE auth_users
          SET telegram_chat_id = ?,
              telegram_verified_at = UTC_TIMESTAMP(3)
        WHERE id = ?`,
      [chatId, token.user_id],
    );

    if (userUpdate.affectedRows !== 1) {
      throw new Error("Akun untuk binding Telegram tidak ditemukan.");
    }

    const [tokenUpdate] = await connection.execute<ResultSetHeader>(
      `UPDATE auth_telegram_bind_tokens
          SET used_at = UTC_TIMESTAMP(3),
              chat_id = ?
        WHERE id = ?
          AND used_at IS NULL`,
      [chatId, token.id],
    );

    if (tokenUpdate.affectedRows !== 1) {
      throw new Error("Token Telegram sudah tidak valid.");
    }

    await connection.commit();

    return { userId: token.user_id };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
