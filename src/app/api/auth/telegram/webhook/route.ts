import { NextResponse, type NextRequest } from "next/server";

import { completeTelegramBinding } from "@/features/auth/lib/auth-service";
import {
  extractTelegramStartToken,
  parseTelegramMessage,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
} from "@/features/auth/lib/auth-telegram";
import {
  handleTelegramHelpdeskCommand,
  handleTelegramTopicInfoCommand,
} from "@/features/helpdesk/lib/helpdesk-telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyTelegramWebhookSecret(request.headers)) {
    return NextResponse.json(
      { ok: false, error: "Webhook Telegram tidak valid." },
      { status: 401 },
    );
  }

  const message = parseTelegramMessage(await request.json());

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const topicInfoHandled = await handleTelegramTopicInfoCommand(message).catch(
    async () => {
      await sendTelegramMessage({
        chatId: message.chatId,
        messageThreadId: message.messageThreadId,
        text: "Topic Telegram belum bisa dibaca. Coba lagi sebentar lagi.",
      }).catch(() => undefined);
      return true;
    },
  );

  if (topicInfoHandled) {
    return NextResponse.json({ ok: true });
  }

  const helpdeskHandled = await handleTelegramHelpdeskCommand(message).catch(
    async () => {
      await sendTelegramMessage({
        chatId: message.chatId,
        messageThreadId: message.messageThreadId,
        text: "Command helpdesk belum bisa diproses. Coba lagi sebentar lagi.",
      }).catch(() => undefined);
      return true;
    },
  );

  if (helpdeskHandled) {
    return NextResponse.json({ ok: true });
  }

  if (message.chatType !== "private") {
    return NextResponse.json({ ok: true });
  }

  const token = extractTelegramStartToken(message.text);

  if (!token) {
    await sendTelegramMessage({
      chatId: message.chatId,
      text: "Buka link binding dari halaman Keamanan Akun SolarTank.",
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  }

  try {
    await completeTelegramBinding({
      token,
      chatId: message.chatId,
      request,
    });
  } catch {
    await sendTelegramMessage({
      chatId: message.chatId,
      text: "Token binding SolarTank tidak valid atau sudah kedaluwarsa.",
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
