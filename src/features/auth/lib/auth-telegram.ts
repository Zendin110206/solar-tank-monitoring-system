import {
  getTelegramBotToken,
  getTelegramBotUsername,
  getTelegramWebhookSecret,
} from "./auth-config";

type TelegramSendResult =
  | { delivered: true }
  | { delivered: false; reason: string };

type TelegramMessage = {
  text: string;
  chatId: string;
  username: string | null;
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
      username?: string;
    };
    from?: {
      username?: string;
    };
  };
};

export function isTelegramConfigured(): boolean {
  return Boolean(getTelegramBotToken());
}

export function buildTelegramDeepLink(token: string): string | null {
  const username = getTelegramBotUsername();

  if (!username) {
    return null;
  }

  return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
}

export function verifyTelegramWebhookSecret(headers: Headers): boolean {
  const expected = getTelegramWebhookSecret();

  if (!expected) {
    return false;
  }

  return headers.get("x-telegram-bot-api-secret-token") === expected;
}

export function parseTelegramPrivateMessage(
  payload: unknown,
): TelegramMessage | null {
  const update = payload as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim();
  const chatType = message?.chat?.type;

  if (!chatId || !text || chatType !== "private") {
    return null;
  }

  return {
    text,
    chatId: String(chatId),
    username: message.chat?.username ?? message.from?.username ?? null,
  };
}

export function extractTelegramStartToken(text: string): string | null {
  const match = /^\/start\s+(.+)$/i.exec(text.trim());
  return match?.[1]?.trim() || null;
}

export async function sendTelegramMessage({
  chatId,
  text,
}: {
  chatId: string;
  text: string;
}): Promise<TelegramSendResult> {
  const token = getTelegramBotToken();

  if (!token) {
    return { delivered: false, reason: "Telegram bot belum dikonfigurasi." };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    },
  );

  if (!response.ok) {
    return {
      delivered: false,
      reason: "Pesan Telegram belum bisa dikirim.",
    };
  }

  return { delivered: true };
}
