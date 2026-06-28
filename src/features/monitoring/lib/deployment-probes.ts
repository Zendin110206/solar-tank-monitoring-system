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

export async function getDeploymentReadiness(
  now = new Date(),
): Promise<DeploymentReadiness> {
  const storageDriver = getMonitoringStorageDriver();
  const storageCheck = await checkStorageReadiness(storageDriver);
  const checks = [storageCheck];

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
