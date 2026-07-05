import type { RowDataPacket } from "mysql2/promise";

import { sendTelegramMessage } from "@/features/auth/lib/auth-telegram";
import type { MonitoringDeviceRequest } from "../types/monitoring";
import { getMysqlPool } from "./mysql-connection";

type AdminTelegramRow = RowDataPacket & {
  telegram_chat_id: string | null;
};

type NotifyResult = {
  attempted: number;
  delivered: number;
  failed: number;
};

function formatOptionalCoordinate(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "-";
}

function buildAdminRequestUrl(requestId: string): string {
  const appBaseUrl = process.env.APP_BASE_URL?.trim() || "http://localhost:3000";
  const url = new URL("/dashboard/admin/device-requests", appBaseUrl);
  url.searchParams.set("request", requestId);
  return url.toString();
}

async function listActiveAdminTelegramChatIds(): Promise<string[]> {
  const pool = getMysqlPool();
  const [rows] = await pool.execute<AdminTelegramRow[]>(
    `
      SELECT telegram_chat_id
      FROM auth_users
      WHERE role = 'admin'
        AND status = 'active'
        AND telegram_chat_id IS NOT NULL
        AND telegram_verified_at IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 20
    `,
  );

  return rows
    .map((row) => row.telegram_chat_id?.trim())
    .filter((chatId): chatId is string => Boolean(chatId));
}

export async function notifyAdminsDeviceRequestCreated(
  request: MonitoringDeviceRequest,
): Promise<NotifyResult> {
  const chatIds = await listActiveAdminTelegramChatIds();

  if (chatIds.length === 0) {
    return {
      attempted: 0,
      delivered: 0,
      failed: 0,
    };
  }

  const adminUrl = buildAdminRequestUrl(request.id);
  const text = [
    "Pengajuan perangkat baru SolarTank",
    "",
    `Kode pengajuan: ${request.requestCode}`,
    `STO: ${request.siteName}`,
    `Wilayah: ${request.areaLabel}`,
    `Device: ${request.deviceCode}`,
    `Tangki: ${request.capacityLiter} L`,
    `Koordinat: ${formatOptionalCoordinate(request.latitude)}, ${formatOptionalCoordinate(request.longitude)}`,
    `Pengaju: ${request.requesterEmail}`,
    "",
    "Admin perlu meninjau data lewat halaman web sebelum paket firmware dibuat.",
    adminUrl,
  ].join("\n");

  const deliveries = await Promise.all(
    chatIds.map((chatId) => sendTelegramMessage({ chatId, text })),
  );
  const delivered = deliveries.filter((delivery) => delivery.delivered).length;

  return {
    attempted: chatIds.length,
    delivered,
    failed: chatIds.length - delivered,
  };
}
