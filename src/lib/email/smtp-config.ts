import "server-only";

import { serverEnv } from "@/lib/config/server-env";

// Pengaturan SMTP bersama untuk email akun, email paket perangkat, dan pemeriksaan /api/ready.

export function hasSmtpConfig(): boolean {
  return Boolean(
    serverEnv.SMTP_HOST?.trim() &&
    serverEnv.SMTP_USER?.trim() &&
    serverEnv.SMTP_PASS?.trim() &&
    serverEnv.SMTP_FROM?.trim(),
  );
}

export function getSmtpPort(): number {
  const parsed = Number(serverEnv.SMTP_PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 587;
}
