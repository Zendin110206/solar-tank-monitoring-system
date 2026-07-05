import nodemailer from "nodemailer";

import {
  canLogOtpInDevelopment,
  isProductionLikeEnvironment,
} from "@/features/auth/lib/auth-config";

export type DevicePackageEmailDeliveryResult =
  | { delivered: true; delivery: "email" | "log" }
  | { delivered: false; delivery: "none"; reason: string };

function getSmtpPort(): number {
  const parsed = Number(process.env.SMTP_PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 587;
}

function hasSmtpConfig(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim(),
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPackageEmailHtml({
  deviceCode,
  downloadUrl,
  expiresAtLabel,
  requestCode,
  siteName,
}: {
  deviceCode: string;
  downloadUrl: string;
  expiresAtLabel: string;
  requestCode: string;
  siteName: string;
}): string {
  const safeDeviceCode = escapeHtml(deviceCode);
  const safeDownloadUrl = escapeHtml(downloadUrl);
  const safeExpiresAtLabel = escapeHtml(expiresAtLabel);
  const safeRequestCode = escapeHtml(requestCode);
  const safeSiteName = escapeHtml(siteName);

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Firmware SolarTank siap</title>
  </head>
  <body style="margin:0;background:#f5faf8;color:#18181b;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5faf8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #eef2f7;">
                <div style="font-size:18px;font-weight:700;color:#18181b;">SolarTank</div>
                <div style="margin-top:4px;font-size:13px;color:#64748b;">Paket firmware perangkat monitoring</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Perangkat Anda disetujui</h1>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Pengajuan <strong>${safeRequestCode}</strong> untuk <strong>${safeSiteName}</strong> sudah disetujui. Paket firmware untuk <strong>${safeDeviceCode}</strong> siap diunduh.</p>
                <p style="margin:22px 0;"><a href="${safeDownloadUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 18px;border-radius:10px;">Download firmware</a></p>
                <p style="margin:0 0 18px;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">Jika tombol tidak bisa dibuka, salin link ini:<br>${safeDownloadUrl}</p>
                <div style="margin:18px 0;padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;color:#1d4ed8;font-size:13px;line-height:1.7;">
                  Isi ZIP: solar_tank_firmware.ino, device_config.h, hardware_profile.h, README_LANGKAH_UPLOAD.md, dan manifest.json.
                </div>
                <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Link berlaku sampai ${safeExpiresAtLabel}. Jangan membagikan paket ini karena file konfigurasi berisi key khusus perangkat tersebut.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;line-height:1.6;color:#64748b;">
                Email ini dikirim otomatis oleh SolarTank. Jangan balas email ini.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function formatExpiresAt(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(value));
}

export async function sendDevicePackageReadyEmail({
  deviceCode,
  downloadExpiresAt,
  downloadUrl,
  email,
  requestCode,
  siteName,
}: {
  deviceCode: string;
  downloadExpiresAt: string;
  downloadUrl: string;
  email: string;
  requestCode: string;
  siteName: string;
}): Promise<DevicePackageEmailDeliveryResult> {
  const expiresAtLabel = formatExpiresAt(downloadExpiresAt);
  const subject = `Firmware SolarTank siap - ${deviceCode}`;
  const text = [
    `Pengajuan ${requestCode} untuk ${siteName} sudah disetujui.`,
    "",
    `Download firmware ${deviceCode}:`,
    downloadUrl,
    "",
    "Isi ZIP:",
    "- solar_tank_firmware.ino",
    "- device_config.h",
    "- hardware_profile.h",
    "- README_LANGKAH_UPLOAD.md",
    "- manifest.json",
    "",
    `Link berlaku sampai ${expiresAtLabel}.`,
    "Jangan membagikan paket ini karena file konfigurasi berisi key perangkat.",
    "",
    isProductionLikeEnvironment()
      ? ""
      : "Ini pesan dari environment non-production.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!hasSmtpConfig()) {
    if (canLogOtpInDevelopment()) {
      globalThis.console.info(`[DEV-DEVICE-PACKAGE] ${email}\n${text}`);
      return { delivered: true, delivery: "log" };
    }

    return {
      delivered: false,
      delivery: "none",
      reason: "SMTP belum dikonfigurasi.",
    };
  }

  const secure =
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" ||
    getSmtpPort() === 465;
  const transporter = nodemailer.createTransport({
    auth: {
      pass: process.env.SMTP_PASS,
      user: process.env.SMTP_USER,
    },
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    html: buildPackageEmailHtml({
      deviceCode,
      downloadUrl,
      expiresAtLabel,
      requestCode,
      siteName,
    }),
    subject,
    text,
    to: email,
  });

  return { delivered: true, delivery: "email" };
}
