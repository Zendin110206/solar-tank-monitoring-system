import "server-only";

import { type AuthSafeUser, type AuthSessionUser } from "../../types/auth";
import {
  getOtpTtlSeconds,
  getSessionLastSeenUpdateSeconds,
  getSessionTtlSeconds,
  shouldRequireAdminOtp,
} from "../auth-config";
import {
  createOtpCode,
  createRandomToken,
  hashOtpCode,
  hashPassword,
  hashRequestFingerprint,
  hashSessionToken,
  hmacSha256Hex,
  passwordNeedsRehash,
  verifyOtpHash,
  verifyPassword,
} from "../auth-crypto";
import { sendAdminLoginOtp } from "../auth-email";
import {
  createAuthSession,
  createOtpCodeRecord,
  findAuthSessionByTokenHash,
  findAuthUserById,
  findAuthUserByIdentity,
  findOtpCodeRecord,
  markOtpAttempt,
  markOtpUsed,
  recordAuthAuditEvent,
  recordFailedLogin,
  resetFailedLogin,
  revokeAuthSession,
  touchAuthSessionIfStale,
  updateAuthUserPasswordHash,
} from "../repositories/mysql-auth-repository";
import {
  type AuthRequestContext,
  getRequestUserAgent,
} from "./request-context";
import { getRequestIp } from "@/lib/http/request";

type LoginResult =
  | {
      ok: true;
      status: "authenticated";
      user: AuthSessionUser;
      sessionToken: string;
      expiresAt: Date;
    }
  | {
      ok: true;
      status: "otp_required";
      challengeId: string;
      delivery: "email" | "log";
    };

type VerifyOtpResult = {
  user: AuthSessionUser;
  sessionToken: string;
  expiresAt: Date;
};

function isLocked(lockedUntil: string | null): boolean {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

function buildSessionExpiry(user: AuthSafeUser): Date {
  return new Date(Date.now() + getSessionTtlSeconds(user.role) * 1000);
}

function buildSessionUser(
  user: AuthSafeUser,
  sessionId: string,
): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    telegramVerifiedAt: user.telegramVerifiedAt,
    passwordChangedAt: user.passwordChangedAt,
    lastLoginAt: user.lastLoginAt,
    sessionId,
  };
}

async function createSessionForUser(
  user: AuthSafeUser,
  request: AuthRequestContext,
): Promise<VerifyOtpResult> {
  const sessionToken = createRandomToken();
  const expiresAt = buildSessionExpiry(user);
  const sessionId = await createAuthSession({
    user,
    sessionTokenHash: hashSessionToken(sessionToken),
    expiresAt,
    ipHash: hashRequestFingerprint(getRequestIp(request)),
    userAgentHash: hashRequestFingerprint(getRequestUserAgent(request)),
  });

  return {
    user: buildSessionUser(user, sessionId),
    sessionToken,
    expiresAt,
  };
}

export async function loginWithPassword({
  identity,
  password,
  request,
}: {
  identity: string;
  password: string;
  request: AuthRequestContext;
}): Promise<LoginResult> {
  const user = await findAuthUserByIdentity(identity);
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!user) {
    await recordAuthAuditEvent({
      eventType: "login_failed_unknown_identity",
      ip,
      userAgent,
      metadata: { identityHash: `sha256:${hmacSha256Hex(identity)}` },
    }).catch(() => undefined);
    throw new Error("Login gagal. Periksa kembali data masuk Anda.");
  }

  if (isLocked(user.lockedUntil)) {
    await recordAuthAuditEvent({
      eventType: "login_failed_locked",
      targetUserId: user.id,
      ip,
      userAgent,
    }).catch(() => undefined);
    throw new Error("Akun terkunci sementara. Coba lagi beberapa saat.");
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    await recordFailedLogin(user.id);
    await recordAuthAuditEvent({
      eventType: "login_failed_invalid_password",
      targetUserId: user.id,
      ip,
      userAgent,
    }).catch(() => undefined);
    throw new Error("Login gagal. Periksa kembali data masuk Anda.");
  }

  if (user.status !== "active") {
    await recordAuthAuditEvent({
      eventType: "login_failed_inactive_user",
      targetUserId: user.id,
      ip,
      userAgent,
      metadata: { status: user.status },
    }).catch(() => undefined);
    throw new Error("Akun belum aktif. Hubungi administrator.");
  }

  if (passwordNeedsRehash(user.passwordHash)) {
    await updateAuthUserPasswordHash({
      userId: user.id,
      passwordHash: await hashPassword(password),
    });
    await recordAuthAuditEvent({
      eventType: "password_hash_upgraded",
      actorUserId: user.id,
      targetUserId: user.id,
      ip,
      userAgent,
    }).catch(() => undefined);
  }

  await resetFailedLogin(user.id);

  if (user.role === "admin" && shouldRequireAdminOtp()) {
    const code = createOtpCode();
    const expiresAt = new Date(Date.now() + getOtpTtlSeconds() * 1000);
    const delivery = await sendAdminLoginOtp({ email: user.email, code });

    if (!delivery.delivered) {
      throw new Error(delivery.reason);
    }

    const challengeId = await createOtpCodeRecord({
      userId: user.id,
      purpose: "login_admin_2fa",
      channel: "email",
      destinationHash: `hmac-sha256:${hmacSha256Hex(user.email)}`,
      codeHash: hashOtpCode(code),
      expiresAt,
    });

    await recordAuthAuditEvent({
      eventType: "login_admin_otp_sent",
      targetUserId: user.id,
      ip,
      userAgent,
      metadata: { delivery: delivery.delivery },
    }).catch(() => undefined);

    return {
      ok: true,
      status: "otp_required",
      challengeId,
      delivery: delivery.delivery,
    };
  }

  const session = await createSessionForUser(user, request);
  await recordAuthAuditEvent({
    eventType: "login_success",
    actorUserId: user.id,
    targetUserId: user.id,
    ip,
    userAgent,
  }).catch(() => undefined);

  return {
    ok: true,
    status: "authenticated",
    ...session,
  };
}

export async function verifyAdminOtpLogin({
  challengeId,
  code,
  request,
}: {
  challengeId: string;
  code: string;
  request: AuthRequestContext;
}): Promise<VerifyOtpResult> {
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  const otp = await findOtpCodeRecord(challengeId);

  if (
    !otp ||
    otp.purpose !== "login_admin_2fa" ||
    otp.used_at ||
    !otp.user_id
  ) {
    throw new Error("Kode masuk tidak valid.");
  }

  if (otp.expires_at.getTime() <= Date.now()) {
    throw new Error("Kode masuk sudah kedaluwarsa.");
  }

  if (otp.attempt_count >= otp.max_attempts) {
    throw new Error("Percobaan kode terlalu banyak.");
  }

  if (!verifyOtpHash(code, otp.code_hash)) {
    await markOtpAttempt(otp.id);
    await recordAuthAuditEvent({
      eventType: "login_admin_otp_failed",
      targetUserId: otp.user_id,
      ip,
      userAgent,
    }).catch(() => undefined);
    throw new Error("Kode masuk tidak valid.");
  }

  const user = await findAuthUserById(otp.user_id);

  if (!user || user.role !== "admin" || user.status !== "active") {
    throw new Error("Akun admin tidak tersedia.");
  }

  await markOtpUsed(otp.id);
  const session = await createSessionForUser(user, request);
  await recordAuthAuditEvent({
    eventType: "login_success_admin_otp",
    actorUserId: user.id,
    targetUserId: user.id,
    ip,
    userAgent,
  }).catch(() => undefined);

  return session;
}

export async function getSessionUserFromToken(
  sessionToken: string | undefined,
): Promise<AuthSessionUser | null> {
  if (!sessionToken) {
    return null;
  }

  const user = await findAuthSessionByTokenHash(hashSessionToken(sessionToken));

  if (user) {
    const staleBefore = new Date(
      Date.now() - getSessionLastSeenUpdateSeconds() * 1000,
    );
    await touchAuthSessionIfStale({
      sessionId: user.sessionId,
      staleBefore,
    }).catch(() => undefined);
  }

  return user;
}

export async function logoutSession(sessionId: string): Promise<void> {
  await revokeAuthSession(sessionId);
}
