import "server-only";

import type { RegisterAccessPayload } from "../domain/auth-validation";
import {
  getAppBaseUrl,
  getTelegramAdminGroupChatId,
  getTelegramAdminTopicThreadId,
  type TelegramAdminTopic,
} from "./auth-config";
import { sendTelegramMessage } from "./auth-telegram";
import { listActiveAdminTelegramChatIds } from "./repositories/mysql-auth-repository";
import { formatDateTimeJakarta } from "@/lib/format";

export type AdminTelegramNotifyResult = {
  attempted: number;
  delivered: number;
  failed: number;
};

type AccessRequestNotificationInput = {
  accessRequestId: string;
  createdAt?: Date;
  payload: Pick<
    RegisterAccessPayload,
    | "accessReason"
    | "email"
    | "fullName"
    | "phone"
    | "requestedRole"
    | "username"
  >;
  userId: string;
};

function formatOptionalText(value: string | null | undefined): string {
  const text = value?.trim();

  if (!text) {
    return "-";
  }

  return text.length > 360 ? `${text.slice(0, 357)}...` : text;
}

export function buildAdminTelegramUrl(
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(path, getAppBaseUrl());

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export async function sendAdminTelegramNotification(
  text: string,
  options?: {
    topic?: TelegramAdminTopic;
  },
): Promise<AdminTelegramNotifyResult> {
  let attempted = 0;
  let delivered = 0;
  const groupChatId = getTelegramAdminGroupChatId();
  const topicThreadId = options?.topic
    ? getTelegramAdminTopicThreadId(options.topic)
    : null;

  if (groupChatId && topicThreadId) {
    attempted += 1;
    const groupDelivery = await sendTelegramMessage({
      chatId: groupChatId,
      messageThreadId: topicThreadId,
      text,
    });

    if (groupDelivery.delivered) {
      return {
        attempted,
        delivered: 1,
        failed: 0,
      };
    }
  }

  const chatIds = await listActiveAdminTelegramChatIds();

  if (chatIds.length === 0) {
    return {
      attempted,
      delivered,
      failed: attempted - delivered,
    };
  }

  const deliveries = await Promise.all(
    chatIds.map((chatId) => sendTelegramMessage({ chatId, text })),
  );
  const privateDelivered = deliveries.filter(
    (delivery) => delivery.delivered,
  ).length;
  attempted += chatIds.length;
  delivered += privateDelivered;

  return {
    attempted,
    delivered,
    failed: attempted - delivered,
  };
}

export async function notifyAdminsAccessRequestSubmitted({
  accessRequestId,
  createdAt = new Date(),
  payload,
  userId,
}: AccessRequestNotificationInput): Promise<AdminTelegramNotifyResult> {
  const adminUrl = buildAdminTelegramUrl("/dashboard/admin/users", {
    request: accessRequestId,
  });
  const text = [
    "Pengajuan akses baru FTM",
    "",
    `Nama: ${payload.fullName}`,
    `Username: ${payload.username}`,
    `Email: ${payload.email}`,
    `Telepon: ${payload.phone}`,
    `Role diminta: ${payload.requestedRole}`,
    `User ID: ${userId}`,
    `Kode pengajuan: ${accessRequestId}`,
    `Waktu: ${formatDateTimeJakarta(createdAt)}`,
    `Alasan: ${formatOptionalText(payload.accessReason)}`,
    "",
    "Admin perlu meninjau akses pengguna lewat dashboard.",
    adminUrl,
  ].join("\n");

  return sendAdminTelegramNotification(text, { topic: "new-account" });
}
