import "server-only";

import { type RegisterAccessPayload } from "../../domain/auth-validation";
import { notifyAdminsAccessRequestSubmitted } from "../admin-telegram-notifications";
import {
  createPendingAccessRequest,
  recordAuthAuditEvent,
} from "../repositories/mysql-auth-repository";
import { getSafeErrorMessage } from "@/lib/safe-error-message";
import { sendEmailVerificationForUserId } from "./email-verification";
import {
  type AuthRequestContext,
  getRequestIp,
  getRequestUserAgent,
} from "./request-context";

export async function submitAccessRequest(
  payload: RegisterAccessPayload,
  request: AuthRequestContext,
): Promise<void> {
  const result = await createPendingAccessRequest(payload);
  await recordAuthAuditEvent({
    eventType: result.created
      ? "access_request_submitted"
      : "access_request_duplicate",
    targetUserId: result.userId,
    ip: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
    metadata: {
      requestedRole: payload.requestedRole,
      accessRequestId: result.accessRequestId || null,
    },
  }).catch(() => undefined);

  if (result.created) {
    await sendEmailVerificationForUserId({
      userId: result.userId,
      request,
    }).catch((error) =>
      recordAuthAuditEvent({
        eventType: "email_verification_send_failed",
        targetUserId: result.userId,
        ip: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
        metadata: {
          reason: getSafeErrorMessage(error, {
            fallbackMessage: "unknown",
            internalMessage: "email_delivery_internal_error",
          }),
        },
      }).catch(() => undefined),
    );
    try {
      const telegramNotification = await notifyAdminsAccessRequestSubmitted({
        accessRequestId: result.accessRequestId,
        payload,
        userId: result.userId,
      });

      await recordAuthAuditEvent({
        eventType:
          telegramNotification.attempted > 0 &&
          telegramNotification.delivered === 0
            ? "access_request_telegram_notify_failed"
            : "access_request_telegram_notified",
        targetUserId: result.userId,
        ip: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
        metadata: {
          accessRequestId: result.accessRequestId,
          attempted: telegramNotification.attempted,
          delivered: telegramNotification.delivered,
          failed: telegramNotification.failed,
        },
      }).catch(() => undefined);
    } catch (error) {
      await recordAuthAuditEvent({
        eventType: "access_request_telegram_notify_failed",
        targetUserId: result.userId,
        ip: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
        metadata: {
          accessRequestId: result.accessRequestId,
          reason: getSafeErrorMessage(error, {
            fallbackMessage: "unknown",
            internalMessage: "telegram_delivery_internal_error",
          }),
        },
      }).catch(() => undefined);
    }
  }
}
