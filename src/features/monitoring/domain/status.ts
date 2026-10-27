import type {
  DeviceStatus,
  LevelStatus,
  OperationalStatus,
  RuntimeStatus,
} from "../types/monitoring";

type DeviceStatusInput = {
  lastReceivedAt?: string | Date | null;
  now?: Date;
  expectedReportIntervalSec: number;
};

type OperationalStatusInput = {
  runtimeStatus: RuntimeStatus;
  levelStatus: LevelStatus;
  deviceStatus: DeviceStatus;
};

export function getRuntimeStatus(runtimeHour: number | null): RuntimeStatus {
  if (runtimeHour === null || !Number.isFinite(runtimeHour)) {
    return "unknown";
  }

  if (runtimeHour < 13) {
    return "critical";
  }

  if (runtimeHour < 16) {
    return "warning";
  }

  if (runtimeHour <= 24) {
    return "limited";
  }

  return "safe";
}

export function getLevelStatus(fillPercent: number): LevelStatus {
  if (fillPercent < 15) {
    return "critical";
  }

  if (fillPercent < 30) {
    return "low";
  }

  if (fillPercent < 50) {
    return "warning";
  }

  return "safe";
}

export function getDeviceStatus({
  lastReceivedAt,
  now = new Date(),
  expectedReportIntervalSec,
}: DeviceStatusInput): DeviceStatus {
  if (!lastReceivedAt || expectedReportIntervalSec <= 0) {
    return "unknown";
  }

  const lastDate =
    lastReceivedAt instanceof Date ? lastReceivedAt : new Date(lastReceivedAt);
  const lastTimeMs = lastDate.getTime();

  if (!Number.isFinite(lastTimeMs)) {
    return "unknown";
  }

  const ageSec = Math.max(0, (now.getTime() - lastTimeMs) / 1000);
  const onlineWindowSec = expectedReportIntervalSec * 2;
  const delayedWindowSec = expectedReportIntervalSec * 4;

  if (ageSec <= onlineWindowSec) {
    return "online";
  }

  if (ageSec <= delayedWindowSec) {
    return "delayed";
  }

  return "offline";
}

export function getOperationalStatus({
  runtimeStatus,
  levelStatus,
  deviceStatus,
}: OperationalStatusInput): OperationalStatus {
  if (
    runtimeStatus === "critical" ||
    levelStatus === "critical" ||
    deviceStatus === "offline"
  ) {
    return "critical";
  }

  if (
    runtimeStatus === "unknown" ||
    runtimeStatus === "warning" ||
    runtimeStatus === "limited" ||
    levelStatus === "low" ||
    levelStatus === "warning" ||
    deviceStatus === "unknown" ||
    deviceStatus === "delayed"
  ) {
    return "warning";
  }

  return "safe";
}
