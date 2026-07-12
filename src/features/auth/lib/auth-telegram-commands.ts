import { getAppBaseUrl } from "./auth-config";
import {
  sendTelegramMessage,
  type TelegramMessage,
} from "./auth-telegram";
import { findAuthUserByVerifiedTelegramChatId } from "./mysql-auth-repository";
import type { AuthSafeUser } from "../types";

type PrivateTelegramCommand = "dashboard" | "help" | "status";

function parsePrivateTelegramCommand(text: string): PrivateTelegramCommand | null {
  const match = /^\/(dashboard|help|status)(?:@\w+)?(?:\s|$)/i.exec(
    text.trim(),
  );
  const command = match?.[1]?.toLowerCase();

  if (
    command === "dashboard" ||
    command === "help" ||
    command === "status"
  ) {
    return command;
  }

  return null;
}

function formatRole(role: AuthSafeUser["role"]): string {
  return role === "admin" ? "Administrator" : "Pengguna";
}

function formatStatus(status: AuthSafeUser["status"]): string {
  switch (status) {
    case "active":
      return "Aktif";
    case "disabled":
      return "Dinonaktifkan";
    case "pending":
      return "Menunggu persetujuan";
    case "suspended":
      return "Ditangguhkan";
  }
}

function formatTelegramDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(value));
}

function buildDashboardUrl(): string | null {
  try {
    return new URL("/dashboard", getAppBaseUrl()).toString();
  } catch {
    return null;
  }
}

function buildHelpMessage(): string {
  return [
    "Bantuan bot FTM",
    "",
    "Command yang tersedia:",
    "/help - lihat daftar command.",
    "/status - cek status koneksi Telegram akun FTM.",
    "/dashboard - buka link dashboard FTM.",
    "",
    "Catatan keamanan: bot tidak akan meminta password, OTP, API key, atau token device.",
  ].join("\n");
}

async function buildStatusMessage(chatId: string): Promise<string> {
  const user = await findAuthUserByVerifiedTelegramChatId(chatId);

  if (!user) {
    return [
      "Telegram ini belum terhubung ke akun FTM.",
      "",
      "Buka dashboard > Keamanan Akun > Hubungkan Telegram, lalu kirim perintah /start TOKEN dari halaman tersebut ke bot ini.",
      "",
      "Gunakan /dashboard untuk membuka link dashboard.",
    ].join("\n");
  }

  return [
    "Status Telegram FTM",
    "",
    "Telegram ini sudah terhubung.",
    `Akun: ${user.fullName || user.username}`,
    `Username: ${user.username}`,
    `Role: ${formatRole(user.role)}`,
    `Status akun: ${formatStatus(user.status)}`,
    `Terhubung: ${formatTelegramDate(user.telegramVerifiedAt)}`,
    "",
    "Data sensitif seperti password, OTP, session, email, nomor telepon, API key, dan token device tidak ditampilkan di Telegram.",
  ].join("\n");
}

function buildDashboardMessage(): string {
  const dashboardUrl = buildDashboardUrl();

  if (!dashboardUrl) {
    return [
      "Link dashboard FTM belum bisa dibuat.",
      "",
      "Minta admin mengisi APP_BASE_URL pada konfigurasi server.",
    ].join("\n");
  }

  return [
    "Dashboard FTM",
    "",
    dashboardUrl,
    "",
    "Login tetap dilakukan melalui browser. Bot tidak menerima password atau token login.",
  ].join("\n");
}

export async function handlePrivateTelegramCommand(
  message: TelegramMessage,
): Promise<boolean> {
  if (message.chatType !== "private") {
    return false;
  }

  const command = parsePrivateTelegramCommand(message.text);

  if (!command) {
    return false;
  }

  const text =
    command === "help"
      ? buildHelpMessage()
      : command === "status"
        ? await buildStatusMessage(message.chatId)
        : buildDashboardMessage();

  await sendTelegramMessage({
    chatId: message.chatId,
    text,
  }).catch(() => undefined);

  return true;
}
