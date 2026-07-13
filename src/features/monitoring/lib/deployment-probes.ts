import type { RowDataPacket } from "mysql2/promise";

import {
  canLogOtpInDevelopment,
  getAppBaseUrl,
  getCaptchaProvider,
  getCaptchaSecretKey,
  getRequiredAuthSecret,
  getTelegramBotToken,
  getTelegramBotUsername,
  getTelegramWebhookSecret,
  isPasswordResetEnabled,
  isProductionLikeEnvironment,
  shouldRequireAdminOtp,
  shouldRequireEmailVerificationForApproval,
} from "../../auth/lib/auth-config";
import {
  getExpectedProvisioningKey,
  isDeviceAutoProvisioningEnabled,
} from "./device-provisioning";
import { isGlobalDeviceKeyFallbackAllowed } from "./device-key";
import { getDevicePackageEncryptionKey } from "./firmware-package";
import { checkMysqlConnection, getMysqlPool } from "./mysql-connection";
import {
  checkMonitoringLocationTaxonomySchemaFromMysql,
  countMonitoringReferenceRowsFromMysql,
} from "./mysql-reference-repository";
import { checkMonitoringReadingStorageSchemaFromMysql } from "./mysql-reading-repository";
import {
  getMonitoringStorageDriver,
  type MonitoringStorageDriver,
} from "./monitoring-storage";

const SERVICE_NAME = "solar-tank-monitoring-system";

export type DeploymentCheckStatus = "ok" | "degraded" | "error";
export type DeploymentReadinessStatus = "ready" | "degraded" | "not_ready";

export type DeploymentHealth = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type DeploymentCheck = {
  name: string;
  ok: boolean;
  status: DeploymentCheckStatus;
  message: string;
  latencyMs?: number;
};

export type DeploymentReadiness = {
  ok: boolean;
  status: DeploymentReadinessStatus;
  service: string;
  timestamp: string;
  appEnv: string;
  nodeEnv: string;
  storageDriver: MonitoringStorageDriver;
  checks: DeploymentCheck[];
};

function getAppEnv(): string {
  return (
    process.env.NEXT_PUBLIC_APP_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

function getNodeEnv(): string {
  return process.env.NODE_ENV || "development";
}

function getElapsedMs(startedAtMs: number): number {
  return Math.max(0, Date.now() - startedAtMs);
}

export function getDeploymentHealth(now = new Date()): DeploymentHealth {
  return {
    status: "ok",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
  };
}

async function checkStorageReadiness(
  storageDriver: MonitoringStorageDriver,
): Promise<DeploymentCheck> {
  if (storageDriver !== "mysql") {
    return {
      name: "memory-storage",
      ok: true,
      status: "degraded",
      message:
        "Storage memory aktif. Aplikasi bisa berjalan, tetapi data tidak permanen.",
    };
  }

  const startedAtMs = Date.now();

  try {
    await checkMysqlConnection();

    return {
      name: "mysql",
      ok: true,
      status: "ok",
      message: "Koneksi MySQL aktif.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  } catch {
    return {
      name: "mysql",
      ok: false,
      status: "error",
      message:
        "Koneksi MySQL gagal. Cek MYSQL_DATABASE_URL, status database, SSL, network, dan allowlist provider.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  }
}

async function checkReferenceRegistryReadiness(): Promise<DeploymentCheck> {
  const startedAtMs = Date.now();

  try {
    const counts = await countMonitoringReferenceRowsFromMysql();
    const ok = counts.sites > 0 && counts.tanks > 0 && counts.devices > 0;

    return {
      name: "mysql-reference-registry",
      ok,
      status: ok ? "ok" : "error",
      message: ok
        ? `Registry MySQL aktif: ${counts.sites} site, ${counts.tanks} tangki, ${counts.devices} device.`
        : "Registry MySQL belum lengkap. Pastikan seed monitoring_sites, monitoring_tanks, dan monitoring_devices sudah dijalankan.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  } catch {
    return {
      name: "mysql-reference-registry",
      ok: false,
      status: "error",
      message:
        "Registry MySQL gagal dicek. Cek migration, tabel reference, permission user database, dan MYSQL_DATABASE_URL.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  }
}

async function checkReadingStorageSchemaReadiness(): Promise<DeploymentCheck> {
  const startedAtMs = Date.now();

  try {
    await checkMonitoringReadingStorageSchemaFromMysql();

    return {
      name: "mysql-reading-rollup",
      ok: true,
      status: "ok",
      message: "Snapshot live dan rollup reading 5 menit siap digunakan.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  } catch {
    return {
      name: "mysql-reading-rollup",
      ok: false,
      status: "error",
      message:
        "Schema rollup reading belum siap. Jalankan migration 007 sebelum menerima telemetry MySQL.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  }
}

async function checkLocationTaxonomySchemaReadiness(): Promise<DeploymentCheck> {
  const startedAtMs = Date.now();

  try {
    await checkMonitoringLocationTaxonomySchemaFromMysql();

    return {
      name: "mysql-location-taxonomy",
      ok: true,
      status: "ok",
      message: "Regional, wilayah, dan area lokasi siap digunakan.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  } catch {
    return {
      name: "mysql-location-taxonomy",
      ok: false,
      status: "error",
      message:
        "Struktur Regional dan Wilayah belum siap. Jalankan migration 009 sebelum men-deploy dashboard lokasi.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  }
}

async function checkAuthTelegramSchemaReadiness(): Promise<DeploymentCheck> {
  const startedAtMs = Date.now();

  try {
    const pool = getMysqlPool();
    const [rows] = await pool.execute<Array<RowDataPacket & { count: number }>>(
      `SELECT COUNT(*) AS count
         FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'auth_users'
          AND index_name = 'uniq_auth_users_telegram_chat_id'
          AND non_unique = 0
          AND column_name = 'telegram_chat_id'
          AND seq_in_index = 1`,
    );

    if (Number(rows[0]?.count ?? 0) !== 1) {
      throw new Error("Unique index Telegram binding belum tersedia.");
    }

    return {
      name: "mysql-auth-telegram",
      ok: true,
      status: "ok",
      message: "Relasi satu akun untuk satu Telegram siap digunakan.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  } catch {
    return {
      name: "mysql-auth-telegram",
      ok: false,
      status: "error",
      message:
        "Schema binding Telegram belum siap. Jalankan migration 008 sebelum mengaktifkan command Telegram.",
      latencyMs: getElapsedMs(startedAtMs),
    };
  }
}

function hasSmtpConfig(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim(),
  );
}

function checkAuthSecretReadiness(): DeploymentCheck {
  try {
    getRequiredAuthSecret();

    if (!process.env.AUTH_SECRET?.trim()) {
      return {
        name: "auth-secret",
        ok: true,
        status: "degraded",
        message:
          "AUTH_SECRET belum diisi. Development fallback aktif dan tidak boleh dipakai untuk production.",
      };
    }

    return {
      name: "auth-secret",
      ok: true,
      status: "ok",
      message: "AUTH_SECRET aktif.",
    };
  } catch {
    return {
      name: "auth-secret",
      ok: false,
      status: "error",
      message: "AUTH_SECRET minimal 32 karakter wajib diisi.",
    };
  }
}

function checkAppBaseUrlReadiness(): DeploymentCheck {
  try {
    const baseUrl = getAppBaseUrl();
    const url = new URL(baseUrl);
    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1";

    if (isProductionLikeEnvironment() && isLocalhost) {
      return {
        name: "app-base-url",
        ok: false,
        status: "error",
        message:
          "APP_BASE_URL production tidak boleh memakai localhost karena dipakai untuk link email.",
      };
    }

    return {
      name: "app-base-url",
      ok: true,
      status: isLocalhost ? "degraded" : "ok",
      message: isLocalhost
        ? "APP_BASE_URL masih memakai localhost. Aman untuk development, bukan untuk production."
        : "APP_BASE_URL siap untuk link email.",
    };
  } catch {
    return {
      name: "app-base-url",
      ok: false,
      status: "error",
      message:
        "APP_BASE_URL wajib diisi dengan URL aplikasi yang valid untuk production.",
    };
  }
}

function checkAdminOtpReadiness(): DeploymentCheck {
  const productionLike = isProductionLikeEnvironment();

  if (!shouldRequireAdminOtp()) {
    return {
      name: "admin-otp",
      ok: !productionLike,
      status: productionLike ? "error" : "degraded",
      message: productionLike
        ? "OTP admin tidak boleh dimatikan di production."
        : "OTP admin sedang dimatikan. Aktifkan sebelum production.",
    };
  }

  if (hasSmtpConfig()) {
    return {
      name: "admin-otp",
      ok: true,
      status: "ok",
      message: "OTP admin aktif dengan SMTP.",
    };
  }

  if (canLogOtpInDevelopment()) {
    return {
      name: "admin-otp",
      ok: true,
      status: "degraded",
      message:
        "SMTP belum diisi. OTP admin hanya dicetak ke log development.",
    };
  }

  return {
    name: "admin-otp",
    ok: false,
    status: "error",
    message: "SMTP wajib diisi saat OTP admin aktif.",
  };
}

function checkAuthEmailFlowReadiness(): DeploymentCheck {
  const needsEmail =
    shouldRequireAdminOtp() ||
    isPasswordResetEnabled() ||
    shouldRequireEmailVerificationForApproval();

  if (!needsEmail) {
    return {
      name: "auth-email-flow",
      ok: !isProductionLikeEnvironment(),
      status: isProductionLikeEnvironment() ? "error" : "degraded",
      message:
        "Semua flow email auth sedang tidak wajib. Kondisi ini tidak disarankan untuk production.",
    };
  }

  if (hasSmtpConfig()) {
    return {
      name: "auth-email-flow",
      ok: true,
      status: "ok",
      message: "SMTP siap untuk OTP, verifikasi email, dan reset password.",
    };
  }

  if (canLogOtpInDevelopment()) {
    return {
      name: "auth-email-flow",
      ok: true,
      status: "degraded",
      message:
        "SMTP belum diisi. Email auth hanya dicetak ke log development.",
    };
  }

  return {
    name: "auth-email-flow",
    ok: false,
    status: "error",
    message:
      "SMTP wajib diisi untuk OTP, verifikasi email, dan reset password.",
  };
}

function checkCaptchaReadiness(): DeploymentCheck {
  const provider = getCaptchaProvider();

  if (provider === "invalid") {
    return {
      name: "auth-captcha",
      ok: false,
      status: "error",
      message:
        "AUTH_CAPTCHA_PROVIDER tidak dikenali. Gunakan disabled atau turnstile.",
    };
  }

  if (provider === "disabled") {
    return {
      name: "auth-captcha",
      ok: !isProductionLikeEnvironment(),
      status: isProductionLikeEnvironment() ? "error" : "degraded",
      message:
        "CAPTCHA form publik nonaktif. Aktifkan Turnstile sebelum production.",
    };
  }

  if (!getCaptchaSecretKey() || !process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY) {
    return {
      name: "auth-captcha",
      ok: false,
      status: "error",
      message:
        "Turnstile aktif tetapi site key atau secret key CAPTCHA belum lengkap.",
    };
  }

  return {
    name: "auth-captcha",
    ok: true,
    status: "ok",
    message: "CAPTCHA Turnstile aktif untuk form publik.",
  };
}

function checkTelegramReadiness(): DeploymentCheck {
  const hasTelegram =
    getTelegramBotToken() && getTelegramWebhookSecret() && getTelegramBotUsername();

  if (hasTelegram) {
    return {
      name: "auth-telegram",
      ok: true,
      status: "ok",
      message: "Telegram bot siap untuk binding akun.",
    };
  }

  return {
    name: "auth-telegram",
    ok: true,
    status: "degraded",
    message:
      "Telegram bot belum lengkap. Sistem tetap berjalan dengan email sebagai kanal utama.",
  };
}

function checkDeviceKeyPolicyReadiness(): DeploymentCheck {
  const productionLike = isProductionLikeEnvironment();

  if (isGlobalDeviceKeyFallbackAllowed()) {
    return {
      name: "device-key-policy",
      ok: !productionLike,
      status: productionLike ? "error" : "degraded",
      message: productionLike
        ? "Global device key fallback wajib dimatikan di production."
        : "Global device key fallback aktif untuk development.",
    };
  }

  return {
    name: "device-key-policy",
    ok: true,
    status: "ok",
    message: "Global device key fallback nonaktif.",
  };
}

function checkAutoProvisioningReadiness(): DeploymentCheck {
  if (!isDeviceAutoProvisioningEnabled()) {
    return {
      name: "device-auto-provisioning",
      ok: true,
      status: "ok",
      message: "Auto provisioning device nonaktif.",
    };
  }

  if (!getExpectedProvisioningKey()) {
    return {
      name: "device-auto-provisioning",
      ok: false,
      status: "error",
      message:
        "Auto provisioning aktif tetapi SOLAR_TANK_DEVICE_PROVISIONING_KEY belum diisi.",
    };
  }

  return {
    name: "device-auto-provisioning",
    ok: true,
    status: "degraded",
    message:
      "Auto provisioning device aktif. Gunakan hanya saat onboarding device baru.",
  };
}

function checkDevicePackageEncryptionReadiness(): DeploymentCheck {
  try {
    getDevicePackageEncryptionKey();

    if (!process.env.DEVICE_PACKAGE_ENCRYPTION_KEY?.trim()) {
      return {
        name: "device-package-encryption",
        ok: true,
        status: "degraded",
        message:
          "DEVICE_PACKAGE_ENCRYPTION_KEY belum diisi. Development fallback aktif dan tidak boleh dipakai untuk production.",
      };
    }

    return {
      name: "device-package-encryption",
      ok: true,
      status: "ok",
      message: "DEVICE_PACKAGE_ENCRYPTION_KEY aktif untuk paket firmware.",
    };
  } catch {
    return {
      name: "device-package-encryption",
      ok: false,
      status: "error",
      message:
        "DEVICE_PACKAGE_ENCRYPTION_KEY wajib valid untuk production dan harus berupa key 32 byte base64/base64url/hex.",
    };
  }
}

function checkDatabaseBackupReadiness(
  storageDriver: MonitoringStorageDriver,
): DeploymentCheck {
  if (storageDriver !== "mysql") {
    return {
      name: "database-backup",
      ok: true,
      status: "degraded",
      message:
        "Backup MySQL belum relevan karena storage memory aktif. Gunakan storage mysql untuk data permanen.",
    };
  }

  const outputDir = process.env.MYSQL_BACKUP_OUTPUT_DIR?.trim();
  const retentionDays = process.env.MYSQL_BACKUP_RETENTION_DAYS?.trim();

  if (!outputDir) {
    return {
      name: "database-backup",
      ok: !isProductionLikeEnvironment(),
      status: isProductionLikeEnvironment() ? "error" : "degraded",
      message:
        "MYSQL_BACKUP_OUTPUT_DIR belum diisi. Tentukan folder backup sebelum production.",
    };
  }

  if (
    retentionDays &&
    (!Number.isFinite(Number(retentionDays)) || Number(retentionDays) < 0)
  ) {
    return {
      name: "database-backup",
      ok: false,
      status: "error",
      message: "MYSQL_BACKUP_RETENTION_DAYS harus angka 0 atau lebih.",
    };
  }

  return {
    name: "database-backup",
    ok: true,
    status: "ok",
    message:
      "Target backup MySQL sudah dikonfigurasi. Jadwalkan pnpm db:backup:mysql dan uji restore berkala.",
  };
}

export async function getDeploymentReadiness(
  now = new Date(),
): Promise<DeploymentReadiness> {
  const storageDriver = getMonitoringStorageDriver();
  const storageCheck = await checkStorageReadiness(storageDriver);
  const checks = [
    storageCheck,
    checkAuthSecretReadiness(),
    checkAppBaseUrlReadiness(),
    checkAdminOtpReadiness(),
    checkAuthEmailFlowReadiness(),
    checkCaptchaReadiness(),
    checkTelegramReadiness(),
    checkDeviceKeyPolicyReadiness(),
    checkAutoProvisioningReadiness(),
    checkDevicePackageEncryptionReadiness(),
    checkDatabaseBackupReadiness(storageDriver),
  ];

  if (storageDriver === "mysql" && storageCheck.ok) {
    const [
      registryCheck,
      readingRollupCheck,
      authTelegramCheck,
      locationTaxonomyCheck,
    ] =
      await Promise.all([
        checkReferenceRegistryReadiness(),
        checkReadingStorageSchemaReadiness(),
        checkAuthTelegramSchemaReadiness(),
        checkLocationTaxonomySchemaReadiness(),
      ]);
    checks.push(
      registryCheck,
      readingRollupCheck,
      authTelegramCheck,
      locationTaxonomyCheck,
    );
  }

  const hasError = checks.some((check) => !check.ok);
  const hasDegraded = checks.some((check) => check.status === "degraded");

  return {
    ok: !hasError,
    status: hasError ? "not_ready" : hasDegraded ? "degraded" : "ready",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    appEnv: getAppEnv(),
    nodeEnv: getNodeEnv(),
    storageDriver,
    checks,
  };
}
