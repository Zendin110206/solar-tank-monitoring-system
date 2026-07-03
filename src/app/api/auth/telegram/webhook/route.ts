import { NextResponse, type NextRequest } from "next/server";

import { completeTelegramBinding } from "@/features/auth/lib/auth-service";
import {
  extractTelegramStartToken,
  parseTelegramPrivateMessage,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
} from "@/features/auth/lib/auth-telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyTelegramWebhookSecret(request.headers)) {
    return NextResponse.json(
      { ok: false, error: "Webhook Telegram tidak valid." },
      { status: 401 },
    );
  }

  const message = parseTelegramPrivateMessage(await request.json());

  if (!message) {
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
