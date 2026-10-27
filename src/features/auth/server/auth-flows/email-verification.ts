import "server-only";

import { getEmailVerificationTtlSeconds } from "../auth-config";
import {
  createRandomToken,
  hashOneTimeToken,
  hashRequestFingerprint,
  hmacSha256Hex,
} from "../auth-crypto";
import { sendEmailVerificationEmail } from "../auth-email";
import {
  createEmailVerificationTokenRecord,
  findAuthUserById,
  findAuthUserByIdentity,
  findEmailVerificationTokenRecord,
  markAuthUserEmailVerified,
  markEmailVerificationTokenUsed,
  recordAuthAuditEvent,
} from "../repositories/mysql-auth-repository";
import {
  type AuthRequestContext,
  buildAppUrl,
  buildTokenExpiry,
  getRequestIp,
  getRequestUserAgent,
  isTokenUsable,
} from "./request-context";

export async function sendEmailVerificationForUserId({
  userId,
  request,
}: {
  userId: string;
  request: AuthRequestContext;
}): Promise<void> {
  const user = await findAuthUserById(userId);
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);

  if (!user || user.emailVerifiedAt) {
    return;
  }

  const token = createRandomToken();
  const tokenHash = hashOneTimeToken(token);

  await createEmailVerificationTokenRecord({
    userId: user.id,
    tokenHash,
    destinationHash: `hmac-sha256:${hmacSha256Hex(user.email)}`,
    expiresAt: buildTokenExpiry(getEmailVerificationTtlSeconds()),
    ipHash: hashRequestFingerprint(ip),
    userAgentHash: hashRequestFingerprint(userAgent),
  });

  const delivery = await sendEmailVerificationEmail({
    email: user.email,
    verificationUrl: buildAppUrl("/api/auth/email/verify", { token }),
  });

  await recordAuthAuditEvent({
    eventType: delivery.delivered
      ? "email_verification_sent"
      : "email_verification_failed",
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

export async function resendEmailVerification({
  identity,
  request,
}: {
  identity: string;
  request: AuthRequestContext;
}): Promise<void> {
  const user = await findAuthUserByIdentity(identity);

  if (!user || user.emailVerifiedAt) {
    return;
  }

  await sendEmailVerificationForUserId({ userId: user.id, request });
}

export async function verifyEmailToken({
  token,
  request,
}: {
  token: string;
  request: AuthRequestContext;
}): Promise<void> {
  const record = await findEmailVerificationTokenRecord(
    hashOneTimeToken(token),
  );

  if (!record || !isTokenUsable(record)) {
    throw new Error("Link verifikasi email sudah tidak valid.");
  }

  await markAuthUserEmailVerified(record.user_id);
  await markEmailVerificationTokenUsed(record.id);
  await recordAuthAuditEvent({
    eventType: "email_verified",
    actorUserId: record.user_id,
    targetUserId: record.user_id,
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  }).catch(() => undefined);
}
