import "server-only";

import { type AuthSessionUser } from "../../types/auth";
import { getTelegramBindTtlSeconds } from "../auth-config";
import {
  createRandomToken,
  hashOneTimeToken,
  hashRequestFingerprint,
} from "../auth-crypto";
import { buildTelegramDeepLink, sendTelegramMessage } from "../auth-telegram";
import {
  completeTelegramBindingInMysql,
  createTelegramBindTokenRecord,
  recordAuthAuditEvent,
} from "../repositories/mysql-auth-repository";
import {
  type AuthRequestContext,
  buildTokenExpiry,
  getRequestIp,
  getRequestUserAgent,
} from "./request-context";

export async function startTelegramBinding({
  user,
  request,
}: {
  user: AuthSessionUser;
  request: AuthRequestContext;
}): Promise<{ token: string; deepLink: string | null; expiresAt: Date }> {
  const token = createRandomToken();
  const expiresAt = buildTokenExpiry(getTelegramBindTtlSeconds());

  await createTelegramBindTokenRecord({
    userId: user.id,
    tokenHash: hashOneTimeToken(token),
    expiresAt,
    ipHash: hashRequestFingerprint(getRequestIp(request)),
    userAgentHash: hashRequestFingerprint(getRequestUserAgent(request)),
  });
  await recordAuthAuditEvent({
    eventType: "telegram_bind_started",
    actorUserId: user.id,
    targetUserId: user.id,
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  }).catch(() => undefined);

  return {
    token,
    deepLink: buildTelegramDeepLink(token),
    expiresAt,
  };
}

export async function completeTelegramBinding({
  token,
  chatId,
  request,
}: {
  token: string;
  chatId: string;
  request: AuthRequestContext;
}): Promise<void> {
  const binding = await completeTelegramBindingInMysql({
    tokenHash: hashOneTimeToken(token),
    chatId,
  });

  if (!binding) {
    throw new Error("Token Telegram sudah tidak valid.");
  }
  await sendTelegramMessage({
    chatId,
    text:
      "Akun Telegram Anda berhasil terhubung ke FTM. ✅\n\n" +
      "Ketik /help untuk melihat bantuan dan fitur yang tersedia.",
  }).catch(() => undefined);
  await recordAuthAuditEvent({
    eventType: "telegram_bound",
    actorUserId: binding.userId,
    targetUserId: binding.userId,
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  }).catch(() => undefined);
}
