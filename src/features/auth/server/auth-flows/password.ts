import "server-only";

import {
  type ChangePasswordPayload,
  type ResetPasswordPayload,
} from "../../domain/auth-validation";
import { type AuthSessionUser } from "../../types/auth";
import {
  getPasswordResetTtlSeconds,
  isPasswordResetEnabled,
} from "../auth-config";
import {
  createRandomToken,
  hashOneTimeToken,
  hashPassword,
  hashRequestFingerprint,
  hmacSha256Hex,
  verifyPassword,
} from "../auth-crypto";
import { sendPasswordResetEmail } from "../auth-email";
import {
  createPasswordResetTokenRecord,
  findAuthUserById,
  findAuthUserByIdentity,
  findPasswordResetTokenRecord,
  markPasswordResetTokenUsed,
  recordAuthAuditEvent,
  revokeAllUserSessions,
  revokeOtherUserSessions,
  updateAuthUserPasswordHash,
} from "../repositories/mysql-auth-repository";
import {
  type AuthRequestContext,
  buildAppUrl,
  buildTokenExpiry,
  getRequestUserAgent,
  isTokenUsable,
} from "./request-context";
import { getRequestIp } from "@/lib/http/request";

export async function requestPasswordReset({
  identity,
  request,
}: {
  identity: string;
  request: AuthRequestContext;
}): Promise<void> {
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!isPasswordResetEnabled()) {
    throw new Error("Reset kata sandi sedang dinonaktifkan.");
  }

  const user = await findAuthUserByIdentity(identity);

  if (!user || user.status === "disabled" || user.status === "suspended") {
    await recordAuthAuditEvent({
      eventType: "password_reset_requested_no_delivery",
      targetUserId: user?.id ?? null,
      ip,
      userAgent,
      metadata: { identityHash: `sha256:${hmacSha256Hex(identity)}` },
    }).catch(() => undefined);
    return;
  }

  const token = createRandomToken();
  const tokenHash = hashOneTimeToken(token);
  const expiresAt = buildTokenExpiry(getPasswordResetTtlSeconds());

  await createPasswordResetTokenRecord({
    userId: user.id,
    tokenHash,
    destinationHash: `hmac-sha256:${hmacSha256Hex(user.email)}`,
    expiresAt,
    ipHash: hashRequestFingerprint(ip),
    userAgentHash: hashRequestFingerprint(userAgent),
  });

  const delivery = await sendPasswordResetEmail({
    email: user.email,
    resetUrl: buildAppUrl("/reset-password", { token }),
  });

  await recordAuthAuditEvent({
    eventType: delivery.delivered
      ? "password_reset_email_sent"
      : "password_reset_email_failed",
    targetUserId: user.id,
    ip,
    userAgent,
    metadata: {
      delivery: delivery.delivery,
      reason: delivery.delivered ? null : delivery.reason,
    },
  }).catch(() => undefined);

  if (!delivery.delivered) {
    throw new Error(delivery.reason);
  }
}

export async function sendPasswordResetForUserId({
  userId,
  request,
}: {
  userId: string;
  request: AuthRequestContext;
}): Promise<void> {
  const user = await findAuthUserById(userId);
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!isPasswordResetEnabled()) {
    throw new Error("Reset kata sandi sedang dinonaktifkan.");
  }

  if (!user || user.status === "disabled" || user.status === "suspended") {
    throw new Error("Akun tidak tersedia untuk reset kata sandi.");
  }

  const token = createRandomToken();
  const expiresAt = buildTokenExpiry(getPasswordResetTtlSeconds());

  await createPasswordResetTokenRecord({
    userId: user.id,
    tokenHash: hashOneTimeToken(token),
    destinationHash: `hmac-sha256:${hmacSha256Hex(user.email)}`,
    expiresAt,
    ipHash: hashRequestFingerprint(ip),
    userAgentHash: hashRequestFingerprint(userAgent),
  });

  const delivery = await sendPasswordResetEmail({
    email: user.email,
    resetUrl: buildAppUrl("/reset-password", { token }),
  });

  await recordAuthAuditEvent({
    eventType: delivery.delivered
      ? "password_reset_admin_email_sent"
      : "password_reset_admin_email_failed",
    targetUserId: user.id,
    ip,
    userAgent,
    metadata: {
      delivery: delivery.delivery,
      reason: delivery.delivered ? null : delivery.reason,
    },
  }).catch(() => undefined);

  if (!delivery.delivered) {
    throw new Error(delivery.reason);
  }
}

export async function resetPasswordWithToken({
  payload,
  request,
}: {
  payload: ResetPasswordPayload;
  request: AuthRequestContext;
}): Promise<void> {
  const token = await findPasswordResetTokenRecord(
    hashOneTimeToken(payload.token),
  );
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!token || !isTokenUsable(token)) {
    throw new Error("Link reset sudah tidak valid atau kedaluwarsa.");
  }

  const user = await findAuthUserById(token.user_id);

  if (!user || user.status === "disabled" || user.status === "suspended") {
    throw new Error("Akun tidak tersedia untuk reset kata sandi.");
  }

  await updateAuthUserPasswordHash({
    userId: user.id,
    passwordHash: await hashPassword(payload.password),
  });
  await markPasswordResetTokenUsed(token.id);
  await revokeAllUserSessions(user.id);
  await recordAuthAuditEvent({
    eventType: "password_reset_completed",
    actorUserId: user.id,
    targetUserId: user.id,
    ip,
    userAgent,
  }).catch(() => undefined);
}

export async function changePasswordForSession({
  user,
  payload,
  request,
}: {
  user: AuthSessionUser;
  payload: ChangePasswordPayload;
  request: AuthRequestContext;
}): Promise<void> {
  const userWithPassword = await findAuthUserByIdentity(user.email);
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!userWithPassword || userWithPassword.id !== user.id) {
    throw new Error("Akun tidak ditemukan.");
  }

  const passwordValid = await verifyPassword(
    payload.currentPassword,
    userWithPassword.passwordHash,
  );

  if (!passwordValid) {
    await recordAuthAuditEvent({
      eventType: "password_change_failed",
      actorUserId: user.id,
      targetUserId: user.id,
      ip,
      userAgent,
    }).catch(() => undefined);
    throw new Error("Kata sandi saat ini tidak sesuai.");
  }

  await updateAuthUserPasswordHash({
    userId: user.id,
    passwordHash: await hashPassword(payload.password),
  });
  await revokeOtherUserSessions({
    userId: user.id,
    currentSessionId: user.sessionId,
  });
  await recordAuthAuditEvent({
    eventType: "password_changed",
    actorUserId: user.id,
    targetUserId: user.id,
    ip,
    userAgent,
  }).catch(() => undefined);
}
