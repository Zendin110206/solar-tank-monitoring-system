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
import { checkMysqlConnection } from "./mysql-connection";
import { countMonitoringReferenceRowsFromMysql } from "./mysql-reference-repository";
import {
  getMonitoringStorageDriver,
  type MonitoringStorageDriver,
} from "./monitoring-storage";

const SERVICE_NAME = "solar-tank-monitoring-system";
const serviceStartedAt = new Date();

export type DeploymentCheckStatus = "ok" | "degraded" | "error";
export type DeploymentReadinessStatus = "ready" | "degraded" | "not_ready";

export type DeploymentHealth = {
  status: "ok";
  service: string;
  timestamp: string;
  startedAt: string;
  uptimeSec: number;
  appEnv: string;
  nodeEnv: string;
  storageDriver: MonitoringStorageDriver;
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

function getUptimeSec(now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - serviceStartedAt.getTime()) / 1000),
  );
}

function getElapsedMs(startedAtMs: number): number {
  return Math.max(0, Date.now() - startedAtMs);
}

export function getDeploymentHealth(now = new Date()): DeploymentHealth {
  return {
    status: "ok",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    startedAt: serviceStartedAt.toISOString(),
    uptimeSec: getUptimeSec(now),
    appEnv: getAppEnv(),
    nodeEnv: getNodeEnv(),
    storageDriver: getMonitoringStorageDriver(),
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
  ];

  if (storageDriver === "mysql" && storageCheck.ok) {
    checks.push(await checkReferenceRegistryReadiness());
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
