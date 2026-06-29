import { mockDevices } from "../data/mock-devices";
import { mockReadings } from "../data/mock-readings";
import { mockSites } from "../data/mock-sites";
import { mockTanks } from "../data/mock-tanks";
import type {
  Device,
  DeviceStatus,
  OperationalStatus,
  Reading,
  RuntimeStatus,
  Site,
  TankConfigStatus,
  Tank,
} from "../types/monitoring";
import { clampNumber } from "./number";
import {
  compareRegistryVsPayloadConfig,
  resolveTankFromPayloadConfig,
} from "./reading-tank-config";
import {
  getDeviceStatus,
  getLevelStatus,
  getOperationalStatus,
  getRuntimeStatus,
} from "./status";
import { buildMapPositionsFromCoordinates } from "./map-position";

export type DashboardSiteStatus = "online" | "warning" | "critical" | "offline";

export type DashboardMonitoringSite = {
  id: string;
  code: string;
  name: string;
  areaLabel: string;
  tankId: string;
  tank: string;
  status: DashboardSiteStatus;
  deviceStatus: DeviceStatus;
  runtimeStatus: RuntimeStatus;
  operationalStatus: OperationalStatus;
  fillPercent: number;
  volumeLiter: number;
  runtimeHour: number;
  lastReceivedAt: string;
  updateLabel: string;
  deviceId: string;
  signal: string;
  left: string;
  top: string;
  note: string;
  consumptionLiterPerHour: number;
  configStatus: TankConfigStatus;
  configNeedsReview: boolean;
  configSummary: string;
};

type DashboardSummary = {
  totalSites: number;
  totalTanks: number;
  criticalTanks: number;
  warningTanks: number;
  onlineDevices: number;
  delayedDevices: number;
  offlineDevices: number;
  averageIntervalLabel: string;
  syncLabel: string;
};

type HealthCard = {
  label: string;
  value: string;
  tone: string;
};

type HealthSegment = {
  label: string;
  width: string;
  tone: string;
};

type TrendBar = {
  hour: string;
  value: number;
};

export type DashboardOverview = {
  generatedAt: string;
  rows: DashboardMonitoringSite[];
  priorityRows: DashboardMonitoringSite[];
  latestRow: DashboardMonitoringSite;
  summary: DashboardSummary;
  healthCards: HealthCard[];
  healthSegments: HealthSegment[];
  trendBars: TrendBar[];
};

type BuildDashboardOverviewInput = {
  now?: Date;
  sites?: Site[];
  tanks?: Tank[];
  devices?: Device[];
  readings?: Reading[];
};

const DEFAULT_NOW = new Date("2026-06-25T07:45:00.000Z");

function getLatestReading(readings: Reading[], tankId: string): Reading | null {
  const tankReadings = readings
    .filter((reading) => reading.tankId === tankId)
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );

  return tankReadings[0] ?? null;
}

function formatAgeLabel(receivedAt: string, now: Date): string {
  const receivedTime = new Date(receivedAt).getTime();

  if (!Number.isFinite(receivedTime)) {
    return "waktu tidak valid";
  }

  const ageSec = Math.max(0, Math.floor((now.getTime() - receivedTime) / 1000));

  if (ageSec < 60) {
    return `${ageSec} dtk lalu`;
  }

  const ageMin = Math.floor(ageSec / 60);

  if (ageMin < 60) {
    return `${ageMin} mnt lalu`;
  }

  const ageHour = Math.floor(ageMin / 60);
  const restMin = ageMin % 60;

  return restMin > 0
    ? `${ageHour} jam ${restMin} mnt lalu`
    : `${ageHour} jam lalu`;
}

function getReceivedTime(receivedAt: string): number {
  const receivedTime = new Date(receivedAt).getTime();
  return Number.isFinite(receivedTime) ? receivedTime : -Infinity;
}

function formatIntervalLabel(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} dtk`;
  }

  return `${Math.round(seconds / 60)} mnt`;
}

function toDashboardStatus(
  deviceStatus: DeviceStatus,
  operationalStatus: OperationalStatus,
): DashboardSiteStatus {
  if (deviceStatus === "offline") {
    return "offline";
  }

  if (operationalStatus === "critical") {
    return "critical";
  }

  if (operationalStatus === "warning") {
    return "warning";
  }

  return "online";
}

function buildStatusNote(row: {
  status: DashboardSiteStatus;
  hasReading: boolean;
  fillPercent: number;
  runtimeHour: number;
  deviceStatus: DeviceStatus;
  configNeedsReview: boolean;
  configSummary: string;
  configReasons: string[];
}): string {
  if (!row.hasReading) {
    return "Belum ada pembacaan dari perangkat. Lokasi perlu dicek setelah perangkat aktif.";
  }

  if (row.configNeedsReview) {
    return `${row.configSummary}. ${row.configReasons[0] ?? "Perlu cek teknisi/admin sebelum config dianggap resmi."}`;
  }

  if (row.status === "offline") {
    return "Perangkat belum mengirim data dalam rentang yang diharapkan.";
  }

  if (row.status === "critical") {
    return `Level atau runtime masuk prioritas kritis. Runtime estimasi ${row.runtimeHour} jam.`;
  }

  if (row.status === "warning") {
    return `Perlu pantauan berkala. Isi ${row.fillPercent}% dan status perangkat ${row.deviceStatus}.`;
  }

  return "Data terbaru stabil dan runtime masih berada di zona aman.";
}

function getPriorityRank(status: DashboardSiteStatus): number {
  const rank: Record<DashboardSiteStatus, number> = {
    critical: 0,
    offline: 1,
    warning: 2,
    online: 3,
  };

  return rank[status];
}

function getPercentWidth(value: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function buildTrendBars(latestPercent: number): TrendBar[] {
  const hours = ["06", "08", "10", "12", "14", "16", "18", "20", "22"];

  return hours.map((hour, index) => {
    const olderOffset = (hours.length - index - 1) * 2;
    const value = clampNumber(latestPercent + olderOffset, 8, 96);

    return {
      hour,
      value,
    };
  });
}

export function buildDashboardOverview({
  now = DEFAULT_NOW,
  sites = mockSites,
  tanks = mockTanks,
  devices = mockDevices,
  readings = mockReadings,
}: BuildDashboardOverviewInput = {}): DashboardOverview {
  const mapPositions = buildMapPositionsFromCoordinates(sites);
  const rows = tanks.flatMap((tank): DashboardMonitoringSite[] => {
    const site = sites.find((item) => item.id === tank.siteId);
    const device = devices.find((item) => item.tankId === tank.id);
    const reading = getLatestReading(readings, tank.id);

    if (!site || !device) {
      return [];
    }

    const configReview = reading?.rawPayload
      ? compareRegistryVsPayloadConfig(tank, reading.rawPayload)
      : compareRegistryVsPayloadConfig(tank, null);
    const displayTank = reading?.rawPayload
      ? resolveTankFromPayloadConfig(reading.rawPayload, tank)
      : tank;
    const fillPercent = reading?.fillPercent ?? 0;
    const volumeLiter = reading?.volumeLiter ?? 0;
    const runtimeHour = reading?.runtimeHour ?? 0;
    const runtimeStatus = reading
      ? getRuntimeStatus(reading.runtimeHour)
      : getRuntimeStatus(null);
    const levelStatus = reading ? getLevelStatus(reading.fillPercent) : "low";
    const deviceStatus = reading
      ? getDeviceStatus({
          lastReceivedAt: reading.receivedAt,
          now,
          expectedReportIntervalSec: device.expectedReportIntervalSec,
        })
      : "offline";
    const operationalStatus = getOperationalStatus({
      runtimeStatus,
      levelStatus,
      deviceStatus,
    });
    const baseStatus = toDashboardStatus(deviceStatus, operationalStatus);
    const status =
      configReview.needsReview && baseStatus === "online"
        ? "warning"
        : baseStatus;
    const position = mapPositions[site.id] ?? { left: "50%", top: "50%" };

    const row: DashboardMonitoringSite = {
      id: `${site.id}-${tank.id}`,
      code: site.code,
      name: site.name,
      areaLabel: site.areaLabel,
      tankId: tank.id,
      tank: tank.name,
      status,
      deviceStatus,
      runtimeStatus,
      operationalStatus,
      fillPercent,
      volumeLiter,
      runtimeHour,
      lastReceivedAt: reading?.receivedAt ?? "",
      updateLabel: reading
        ? formatAgeLabel(reading.receivedAt, now)
        : "belum ada data",
      deviceId: device.code,
      signal:
        typeof reading?.rssiDbm === "number" ? `${reading.rssiDbm} dBm` : "-",
      left: position.left,
      top: position.top,
      note: "",
      consumptionLiterPerHour: displayTank.consumptionLiterPerHour,
      configStatus: configReview.status,
      configNeedsReview: configReview.needsReview,
      configSummary: configReview.summaryLabel,
    };

    return [
      {
        ...row,
        note: buildStatusNote({
          ...row,
          hasReading: Boolean(reading),
          configReasons: configReview.reasons,
        }),
      },
    ];
  });

  if (rows.length === 0) {
    throw new Error("Dashboard overview requires at least one monitoring row.");
  }

  const priorityRows = rows
    .filter((row) => row.status !== "online")
    .sort(
      (a, b) =>
        getPriorityRank(a.status) - getPriorityRank(b.status) ||
        a.runtimeHour - b.runtimeHour,
    );

  const latestRow = [...rows].sort(
    (a, b) => getReceivedTime(b.lastReceivedAt) - getReceivedTime(a.lastReceivedAt),
  )[0];
  const onlineDevices = rows.filter(
    (row) => row.deviceStatus === "online",
  ).length;
  const delayedDevices = rows.filter(
    (row) => row.deviceStatus === "delayed",
  ).length;
  const offlineDevices = rows.filter(
    (row) => row.deviceStatus === "offline",
  ).length;
  const criticalTanks = rows.filter((row) => row.status === "critical").length;
  const warningTanks = rows.filter((row) => row.status === "warning").length;
  const averageIntervalSec =
    devices.reduce(
      (total, device) => total + device.expectedReportIntervalSec,
      0,
    ) / Math.max(devices.length, 1);
  const totalRows = rows.length;

  const summary: DashboardSummary = {
    totalSites: sites.filter((site) => site.isActive).length,
    totalTanks: rows.length,
    criticalTanks,
    warningTanks,
    onlineDevices,
    delayedDevices,
    offlineDevices,
    averageIntervalLabel: formatIntervalLabel(averageIntervalSec),
    syncLabel:
      latestRow.lastReceivedAt === ""
        ? "Belum ada data"
        : `Sinkron ${latestRow.updateLabel}`,
  };

  return {
    generatedAt: now.toISOString(),
    rows,
    priorityRows,
    latestRow,
    summary,
    healthCards: [
      {
        label: "Online",
        value: String(onlineDevices),
        tone: "text-emerald-700 bg-emerald-50",
      },
      {
        label: "Terlambat",
        value: String(delayedDevices),
        tone: "text-amber-700 bg-amber-50",
      },
      {
        label: "Kritis",
        value: String(criticalTanks),
        tone: "text-red-700 bg-red-50",
      },
      {
        label: "Offline",
        value: String(offlineDevices),
        tone: "text-zinc-700 bg-zinc-100",
      },
    ],
    healthSegments: [
      {
        label: "Online",
        width: getPercentWidth(onlineDevices, totalRows),
        tone: "bg-emerald-500",
      },
      {
        label: "Terlambat",
        width: getPercentWidth(delayedDevices, totalRows),
        tone: "bg-amber-500",
      },
      {
        label: "Kritis",
        width: getPercentWidth(criticalTanks, totalRows),
        tone: "bg-red-500",
      },
      {
        label: "Offline",
        width: getPercentWidth(offlineDevices, totalRows),
        tone: "bg-zinc-950",
      },
    ],
    trendBars: buildTrendBars(latestRow.fillPercent),
  };
}
