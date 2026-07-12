import {
  buildAdminTelegramUrl,
  sendAdminTelegramNotification,
  type AdminTelegramNotifyResult,
} from "@/features/auth/lib/admin-telegram-notifications";
import type { MonitoringDeviceRequest } from "../types/monitoring";

function formatOptionalCoordinate(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "-";
}

function buildAdminRequestUrl(requestId: string): string {
  return buildAdminTelegramUrl("/dashboard/admin/device-requests", {
    request: requestId,
  });
}

export async function notifyAdminsDeviceRequestCreated(
  request: MonitoringDeviceRequest,
): Promise<AdminTelegramNotifyResult> {
  const adminUrl = buildAdminRequestUrl(request.id);
  const text = [
    "Pengajuan perangkat baru FTM",
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

  return sendAdminTelegramNotification(text, { topic: "new-device" });
}
