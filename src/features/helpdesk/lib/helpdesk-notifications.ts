import {
  sendAdminTelegramNotification,
  type AdminTelegramNotifyResult,
} from "@/features/auth/lib/admin-telegram-notifications";
import type { HelpdeskMessage, HelpdeskSession } from "../types";
import { summarizeHelpdeskSession } from "./helpdesk-repository";

export async function notifyAdminsHelpdeskMessageCreated({
  message,
  session,
}: {
  message: HelpdeskMessage;
  session: HelpdeskSession;
}): Promise<AdminTelegramNotifyResult> {
  const text = [
    "Web Chat Service",
    "",
    summarizeHelpdeskSession(session),
    "",
    "Pesan user:",
    message.body,
    "",
    `Balas: /reply ${session.sessionCode} isi balasan`,
    `Tutup: /close ${session.sessionCode}`,
  ].join("\n");

  return sendAdminTelegramNotification(text, { topic: "live-chat" });
}
