import { afterEach, describe, expect, it } from "vitest";

import {
  getDeploymentHealth,
  getDeploymentReadiness,
} from "../lib/deployment-probes";

const originalStorageDriver = process.env.SOLAR_TANK_STORAGE_DRIVER;
const originalGlobalDeviceKeyFallback =
  process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK;
const originalAutoProvisioning = process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES;
const originalProvisioningKey =
  process.env.SOLAR_TANK_DEVICE_PROVISIONING_KEY;
const originalMysqlDatabaseUrl = process.env.MYSQL_DATABASE_URL;
const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
const originalAppBaseUrl = process.env.APP_BASE_URL;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalAuthRequireAdminOtp = process.env.AUTH_REQUIRE_ADMIN_OTP;
const originalAuthAllowDevOtpLog = process.env.AUTH_ALLOW_DEV_OTP_LOG;
const originalCaptchaProvider = process.env.AUTH_CAPTCHA_PROVIDER;
const originalCaptchaSiteKey = process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY;
const originalCaptchaSecretKey = process.env.AUTH_CAPTCHA_SECRET_KEY;
const originalSmtpHost = process.env.SMTP_HOST;
const originalSmtpUser = process.env.SMTP_USER;
const originalSmtpPass = process.env.SMTP_PASS;
const originalSmtpFrom = process.env.SMTP_FROM;

function restoreEnv() {
  if (typeof originalStorageDriver === "undefined") {
    delete process.env.SOLAR_TANK_STORAGE_DRIVER;
  } else {
    process.env.SOLAR_TANK_STORAGE_DRIVER = originalStorageDriver;
  }

  if (typeof originalMysqlDatabaseUrl === "undefined") {
    delete process.env.MYSQL_DATABASE_URL;
  } else {
    process.env.MYSQL_DATABASE_URL = originalMysqlDatabaseUrl;
  }

  if (typeof originalGlobalDeviceKeyFallback === "undefined") {
    delete process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK;
  } else {
    process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK =
      originalGlobalDeviceKeyFallback;
  }

  if (typeof originalAutoProvisioning === "undefined") {
    delete process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES;
  } else {
    process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES = originalAutoProvisioning;
  }

  if (typeof originalProvisioningKey === "undefined") {
    delete process.env.SOLAR_TANK_DEVICE_PROVISIONING_KEY;
  } else {
    process.env.SOLAR_TANK_DEVICE_PROVISIONING_KEY = originalProvisioningKey;
  }

  if (typeof originalAppEnv === "undefined") {
    delete process.env.NEXT_PUBLIC_APP_ENV;
  } else {
    process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
  }

  if (typeof originalAppBaseUrl === "undefined") {
    delete process.env.APP_BASE_URL;
  } else {
    process.env.APP_BASE_URL = originalAppBaseUrl;
  }

  if (typeof originalAuthSecret === "undefined") {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }

  if (typeof originalAuthRequireAdminOtp === "undefined") {
    delete process.env.AUTH_REQUIRE_ADMIN_OTP;
  } else {
    process.env.AUTH_REQUIRE_ADMIN_OTP = originalAuthRequireAdminOtp;
  }

  if (typeof originalAuthAllowDevOtpLog === "undefined") {
    delete process.env.AUTH_ALLOW_DEV_OTP_LOG;
  } else {
    process.env.AUTH_ALLOW_DEV_OTP_LOG = originalAuthAllowDevOtpLog;
  }

  if (typeof originalCaptchaProvider === "undefined") {
    delete process.env.AUTH_CAPTCHA_PROVIDER;
  } else {
    process.env.AUTH_CAPTCHA_PROVIDER = originalCaptchaProvider;
  }

  if (typeof originalCaptchaSiteKey === "undefined") {
    delete process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY;
  } else {
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY = originalCaptchaSiteKey;
  }

  if (typeof originalCaptchaSecretKey === "undefined") {
    delete process.env.AUTH_CAPTCHA_SECRET_KEY;
  } else {
    process.env.AUTH_CAPTCHA_SECRET_KEY = originalCaptchaSecretKey;
  }

  if (typeof originalSmtpHost === "undefined") {
    delete process.env.SMTP_HOST;
  } else {
    process.env.SMTP_HOST = originalSmtpHost;
  }

  if (typeof originalSmtpUser === "undefined") {
    delete process.env.SMTP_USER;
  } else {
    process.env.SMTP_USER = originalSmtpUser;
  }

  if (typeof originalSmtpPass === "undefined") {
    delete process.env.SMTP_PASS;
  } else {
    process.env.SMTP_PASS = originalSmtpPass;
  }

  if (typeof originalSmtpFrom === "undefined") {
    delete process.env.SMTP_FROM;
  } else {
    process.env.SMTP_FROM = originalSmtpFrom;
  }
}

describe("deployment probes", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("reports basic health without exposing secret values", () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";

    const health = getDeploymentHealth(new Date("2026-06-27T02:30:00.000Z"));

    expect(health).toMatchObject({
      status: "ok",
      service: "solar-tank-monitoring-system",
      timestamp: "2026-06-27T02:30:00.000Z",
      storageDriver: "memory",
    });
    expect(JSON.stringify(health)).not.toContain("MYSQL_DATABASE_URL");
    expect(JSON.stringify(health)).not.toContain("local-development-key");
  });

  it("marks memory storage as degraded but reachable", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );

    expect(readiness.ok).toBe(true);
    expect(readiness.status).toBe("degraded");
    expect(readiness.storageDriver).toBe("memory");
    expect(readiness.checks[0]).toMatchObject({
      name: "memory-storage",
      ok: true,
      status: "degraded",
    });
  });

  it("marks mysql storage as not ready when connection settings are missing", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "mysql";
    delete process.env.MYSQL_DATABASE_URL;

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );

    expect(readiness.ok).toBe(false);
    expect(readiness.status).toBe("not_ready");
    expect(readiness.storageDriver).toBe("mysql");
    expect(readiness.checks[0]).toMatchObject({
      name: "mysql",
      ok: false,
      status: "error",
    });
  });

  it("does not expose database url or device key in readiness output", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.MYSQL_DATABASE_URL =
      "mysql://secret-user:secret-pass@example/db";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const serialized = JSON.stringify(readiness);

    expect(serialized).not.toContain("secret-user");
    expect(serialized).not.toContain("secret-pass");
    expect(serialized).not.toContain("local-development-key");
  });

  it("marks production auth as not ready when secret or SMTP is missing", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK = "false";
    process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES = "false";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    delete process.env.AUTH_SECRET;
    delete process.env.APP_BASE_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const authSecret = readiness.checks.find(
      (check) => check.name === "auth-secret",
    );
    const adminOtp = readiness.checks.find(
      (check) => check.name === "admin-otp",
    );

    expect(readiness.ok).toBe(false);
    expect(readiness.status).toBe("not_ready");
    expect(authSecret).toMatchObject({ ok: false, status: "error" });
    expect(adminOtp).toMatchObject({ ok: false, status: "error" });
  });

  it("marks production as not ready when global device fallback is enabled", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK = "true";
    process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES = "false";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    process.env.APP_BASE_URL = "https://solar-tank.example.com";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM = "SolarTank <noreply@example.com>";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const devicePolicy = readiness.checks.find(
      (check) => check.name === "device-key-policy",
    );

    expect(readiness.ok).toBe(false);
    expect(devicePolicy).toMatchObject({ ok: false, status: "error" });
  });

  it("marks production as not ready when app base url is missing or localhost", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK = "false";
    process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES = "false";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.AUTH_CAPTCHA_PROVIDER = "turnstile";
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY = "site-key";
    process.env.AUTH_CAPTCHA_SECRET_KEY = "secret-key";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM = "SolarTank <noreply@example.com>";
    delete process.env.APP_BASE_URL;

    const missingUrl = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const missingBaseUrl = missingUrl.checks.find(
      (check) => check.name === "app-base-url",
    );

    process.env.APP_BASE_URL = "http://localhost:3000";
    const localhostUrl = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const localhostBaseUrl = localhostUrl.checks.find(
      (check) => check.name === "app-base-url",
    );

    expect(missingBaseUrl).toMatchObject({ ok: false, status: "error" });
    expect(localhostBaseUrl).toMatchObject({ ok: false, status: "error" });
  });

  it("marks readiness as not ready when captcha provider is invalid", async () => {
    process.env.SOLAR_TANK_STORAGE_DRIVER = "memory";
    process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK = "false";
    process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES = "false";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    process.env.APP_BASE_URL = "https://solar-tank.example.com";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.AUTH_CAPTCHA_PROVIDER = "turnstyle";
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY = "site-key";
    process.env.AUTH_CAPTCHA_SECRET_KEY = "secret-key";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM = "SolarTank <noreply@example.com>";

    const readiness = await getDeploymentReadiness(
      new Date("2026-06-27T02:30:00.000Z"),
    );
    const captcha = readiness.checks.find(
      (check) => check.name === "auth-captcha",
    );

    expect(readiness.ok).toBe(false);
    expect(captcha).toMatchObject({ ok: false, status: "error" });
  });
});
