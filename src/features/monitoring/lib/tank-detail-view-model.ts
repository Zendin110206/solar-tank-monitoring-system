import { mockDevices } from "../data/mock-devices";
import { mockReadings } from "../data/mock-readings";
import { mockSites } from "../data/mock-sites";
import { mockTanks } from "../data/mock-tanks";
import type {
  Device,
  DeviceStatus,
  LevelStatus,
  OperationalStatus,
  Reading,
  RuntimeStatus,
  Site,
  Tank,
} from "../types/monitoring";
import { clampNumber, roundTo } from "./number";
import { calculateRuntimeHours } from "./runtime";
import {
  getDeviceStatus,
  getLevelStatus,
  getOperationalStatus,
  getRuntimeStatus,
} from "./status";
import {
  calculateFillPercent,
  calculateTankVolumeLiter,
  getMaxFuelHeightCm,
} from "./tank-volume";
import { buildMapPositionsFromCoordinates } from "./map-position";

export type TankDetailStatus = "online" | "warning" | "critical" | "offline";

export type TankReadingPoint = {
  measuredAt: string;
  receivedAt: string;
  timeLabel: string;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  volumeLiter: number;
  fillPercent: number;
  runtimeHour: number;
  status: "received" | "low" | "critical";
};

export type NearbyTankSite = {
  siteId: string;
  tankId: string;
  code: string;
  name: string;
  status: TankDetailStatus;
  left: string;
  top: string;
  runtimeHour: number;
  fillPercent: number;
  updateLabel: string;
};

export type TankDetailView = {
  id: string;
  hasReading: boolean;
  siteCode: string;
  siteName: string;
  areaLabel: string;
  tankName: string;
  status: TankDetailStatus;
  statusLabel: string;
  statusNote: string;
  statuses: {
    runtimeStatus: RuntimeStatus;
    levelStatus: LevelStatus;
    deviceStatus: DeviceStatus;
    operationalStatus: OperationalStatus;
  };
  fillPercent: number;
  volumeLiter: number;
  capacityLiter: number;
  shape: Tank["shape"];
  shapeLabel: string;
  runtimeHour: number;
  consumptionLiterPerHour: number;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  diameterCm: number | null;
  lengthCm: number | null;
  heightCm: number | null;
  widthCm: number | null;
  sensorMountHeightCm: number;
  lowLevelPercent: number;
  criticalLevelPercent: number;
  deviceId: string;
  deviceCode: string;
  deviceLabel: string;
  expectedIntervalSec: number;
  expectedIntervalMin: number;
  lastUpdateLabel: string;
  measuredAt: string;
  measuredAtLabel: string;
  receivedAt: string;
  receivedAtLabel: string;
  rssiDbm: number | null;
  batteryVolt: number | null;
  coordinate: {
    latitude: number | null;
    longitude: number | null;
    label: string;
    markerLeft: string;
    markerTop: string;
  };
  rawPayloadPreview: {
    distance: number;
    H_cm: number;
    volume: number;
    percent: number;
    wifi_rssi: number | null;
  };
  readings: TankReadingPoint[];
  nearbySites: NearbyTankSite[];
};

type BuildTankDetailInput = {
  now?: Date;
  sites?: Site[];
  tanks?: Tank[];
  devices?: Device[];
  readings?: Reading[];
};

type TankBundle = {
  site: Site;
  tank: Tank;
  device: Device;
  latestReading: Reading | null;
};

const DEFAULT_NOW = new Date("2026-06-25T07:45:00.000Z");

const statusLabels: Record<TankDetailStatus, string> = {
  online: "Online",
  warning: "Waspada",
  critical: "Kritis",
  offline: "Offline",
};

function getTankShapeLabel(shape: Tank["shape"]): string {
  return shape === "rectangular"
    ? "Tangki balok"
    : "Tangki silinder horizontal";
}

function getLatestReading(readings: Reading[], tankId: string): Reading | null {
  const tankReadings = readings
    .filter((reading) => reading.tankId === tankId)
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );

  return tankReadings[0] ?? null;
}

function findTankBundle(
  tankId: string,
  {
    sites = mockSites,
    tanks = mockTanks,
    devices = mockDevices,
    readings = mockReadings,
  }: BuildTankDetailInput,
): TankBundle | null {
  const tank = tanks.find((item) => item.id === tankId);

  if (!tank) {
    return null;
  }

  const site = sites.find((item) => item.id === tank.siteId);
  const device = devices.find((item) => item.tankId === tank.id);
  const latestReading = getLatestReading(readings, tank.id);

  if (!site || !device) {
    return null;
  }

  return {
    site,
    tank,
    device,
    latestReading,
  };
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

function formatTimeLabel(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "waktu tidak valid";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  }).format(date);
}

function toTankDetailStatus(
  deviceStatus: DeviceStatus,
  operationalStatus: OperationalStatus,
): TankDetailStatus {
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

function buildStatusNote({
  status,
  hasReading,
  fillPercent,
  runtimeHour,
  deviceStatus,
}: {
  status: TankDetailStatus;
  hasReading: boolean;
  fillPercent: number;
  runtimeHour: number;
  deviceStatus: DeviceStatus;
}): string {
  if (!hasReading) {
    return "Belum ada pembacaan dari perangkat. Detail tetap ditampilkan agar lokasi bisa dicek dan disiapkan sebelum data pertama masuk.";
  }

  if (status === "offline") {
    return "Perangkat belum mengirim data dalam rentang yang diharapkan.";
  }

  if (status === "critical") {
    return `Tangki masuk prioritas karena level atau runtime rendah. Runtime estimasi ${runtimeHour} jam.`;
  }

  if (status === "warning") {
    return `Perlu dipantau berkala. Isi ${fillPercent}% dan status perangkat ${deviceStatus}.`;
  }

  return "Pembacaan terbaru masih segar dan level solar berada di zona aman.";
}

function getReadingPointStatus(
  fillPercent: number,
): TankReadingPoint["status"] {
  if (fillPercent < 15) {
    return "critical";
  }

  if (fillPercent < 30) {
    return "low";
  }

  return "received";
}

function toReadingPoint(reading: Reading): TankReadingPoint {
  return {
    measuredAt: reading.measuredAt,
    receivedAt: reading.receivedAt,
    timeLabel: formatTimeLabel(reading.receivedAt),
    sensorDistanceCm: reading.sensorDistanceCm,
    fuelHeightCm: reading.fuelHeightCm,
    volumeLiter: reading.volumeLiter,
    fillPercent: reading.fillPercent,
    runtimeHour: reading.runtimeHour,
    status: getReadingPointStatus(reading.fillPercent),
  };
}

function getCoordinateLabel(site: Site): string {
  if (typeof site.latitude === "number" && typeof site.longitude === "number") {
    return `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)} (koordinat manual)`;
  }

  return "koordinat manual belum diisi";
}

function buildReadingSeries(
  tank: Tank,
  latestReading: Reading | null,
  readings: Reading[],
): TankReadingPoint[] {
  if (!latestReading) {
    return [];
  }

  const tankReadings = readings
    .filter((reading) => reading.tankId === tank.id)
    .sort(
      (a, b) =>
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );

  if (tankReadings.length > 1) {
    return tankReadings.slice(-24).map(toReadingPoint);
  }

  const baseReceivedTime = new Date(latestReading.receivedAt).getTime();
  const baseMeasuredTime = new Date(latestReading.measuredAt).getTime();
  const maxFuelHeightCm = getMaxFuelHeightCm(tank);
  const historyHours = [14, 12, 10, 8, 6, 4, 2, 0];

  return historyHours.map((hoursAgo) => {
    if (hoursAgo === 0) {
      return toReadingPoint(latestReading);
    }

    const receivedAt = new Date(
      baseReceivedTime - hoursAgo * 60 * 60 * 1000,
    ).toISOString();
    const measuredAt = new Date(
      baseMeasuredTime - hoursAgo * 60 * 60 * 1000,
    ).toISOString();
    const fuelHeightCm = roundTo(
      clampNumber(
        latestReading.fuelHeightCm + hoursAgo * 1.2,
        0,
        maxFuelHeightCm,
      ),
      2,
    );
    const sensorDistanceCm = roundTo(
      clampNumber(
        tank.sensorMountHeightCm - fuelHeightCm,
        0,
        tank.sensorMountHeightCm,
      ),
      2,
    );
    const volumeLiter = calculateTankVolumeLiter(tank, fuelHeightCm);
    const fillPercent = calculateFillPercent(volumeLiter, tank.capacityLiter);
    const runtimeHour =
      calculateRuntimeHours(volumeLiter, tank.consumptionLiterPerHour) ?? 0;

    return {
      measuredAt,
      receivedAt,
      timeLabel: formatTimeLabel(receivedAt),
      sensorDistanceCm,
      fuelHeightCm,
      volumeLiter,
      fillPercent,
      runtimeHour,
      status: getReadingPointStatus(fillPercent),
    };
  });
}

function buildNearbySites(
  selectedTankId: string,
  input: Required<Pick<BuildTankDetailInput, "now">> & BuildTankDetailInput,
): NearbyTankSite[] {
  const tanks = input.tanks ?? mockTanks;
  const mapPositions = buildMapPositionsFromCoordinates(
    input.sites ?? mockSites,
  );

  return tanks
    .flatMap((tank): NearbyTankSite[] => {
      const bundle = findTankBundle(tank.id, input);

      if (!bundle) {
        return [];
      }

      const { site, device, latestReading } = bundle;
      const fillPercent = latestReading?.fillPercent ?? 0;
      const runtimeHour = latestReading?.runtimeHour ?? 0;
      const runtimeStatus = latestReading
        ? getRuntimeStatus(latestReading.runtimeHour)
        : getRuntimeStatus(null);
      const levelStatus = latestReading
        ? getLevelStatus(latestReading.fillPercent)
        : "low";
      const deviceStatus = latestReading
        ? getDeviceStatus({
            lastReceivedAt: latestReading.receivedAt,
            now: input.now,
            expectedReportIntervalSec: device.expectedReportIntervalSec,
          })
        : "offline";
      const operationalStatus = getOperationalStatus({
        runtimeStatus,
        levelStatus,
        deviceStatus,
      });
      const status = toTankDetailStatus(deviceStatus, operationalStatus);
      const position = mapPositions[site.id] ?? { left: "50%", top: "50%" };

      return [
        {
          siteId: site.id,
          tankId: tank.id,
          code: site.code,
          name: site.name,
          status,
          left: position.left,
          top: position.top,
          runtimeHour,
          fillPercent,
          updateLabel: latestReading
            ? formatAgeLabel(latestReading.receivedAt, input.now)
            : "belum ada data",
        },
      ];
    })
    .sort((a, b) => {
      if (a.tankId === selectedTankId) {
        return -1;
      }

      if (b.tankId === selectedTankId) {
        return 1;
      }

      return a.code.localeCompare(b.code);
    });
}

export function buildTankDetail(
  tankId: string,
  input: BuildTankDetailInput = {},
): TankDetailView | null {
  const now = input.now ?? DEFAULT_NOW;
  const readings = input.readings ?? mockReadings;
  const bundle = findTankBundle(tankId, input);

  if (!bundle) {
    return null;
  }

  const { site, tank, device, latestReading } = bundle;
  const hasReading = Boolean(latestReading);
  const fillPercent = latestReading?.fillPercent ?? 0;
  const volumeLiter = latestReading?.volumeLiter ?? 0;
  const runtimeHour = latestReading?.runtimeHour ?? 0;
  const sensorDistanceCm =
    latestReading?.sensorDistanceCm ?? tank.sensorMountHeightCm;
  const fuelHeightCm = latestReading?.fuelHeightCm ?? 0;
  const runtimeStatus = latestReading
    ? getRuntimeStatus(latestReading.runtimeHour)
    : getRuntimeStatus(null);
  const levelStatus = latestReading ? getLevelStatus(fillPercent) : "low";
  const deviceStatus = latestReading
    ? getDeviceStatus({
        lastReceivedAt: latestReading.receivedAt,
        now,
        expectedReportIntervalSec: device.expectedReportIntervalSec,
      })
    : "offline";
  const operationalStatus = getOperationalStatus({
    runtimeStatus,
    levelStatus,
    deviceStatus,
  });
  const status = toTankDetailStatus(deviceStatus, operationalStatus);
  const mapPositions = buildMapPositionsFromCoordinates(
    input.sites ?? mockSites,
  );
  const position = mapPositions[site.id] ?? { left: "50%", top: "50%" };

  return {
    id: tank.id,
    hasReading,
    siteCode: site.code,
    siteName: site.name,
    areaLabel: site.areaLabel,
    tankName: tank.name,
    status,
    statusLabel: statusLabels[status],
    statusNote: buildStatusNote({
      hasReading,
      status,
      fillPercent,
      runtimeHour,
      deviceStatus,
    }),
    statuses: {
      runtimeStatus,
      levelStatus,
      deviceStatus,
      operationalStatus,
    },
    fillPercent,
    volumeLiter,
    capacityLiter: tank.capacityLiter,
    shape: tank.shape,
    shapeLabel: getTankShapeLabel(tank.shape),
    runtimeHour,
    consumptionLiterPerHour: tank.consumptionLiterPerHour,
    sensorDistanceCm,
    fuelHeightCm,
    diameterCm: tank.diameterCm ?? null,
    lengthCm: tank.lengthCm ?? null,
    heightCm: tank.heightCm ?? null,
    widthCm: tank.widthCm ?? null,
    sensorMountHeightCm: tank.sensorMountHeightCm,
    lowLevelPercent: tank.lowLevelPercent,
    criticalLevelPercent: tank.criticalLevelPercent,
    deviceId: device.id,
    deviceCode: device.code,
    deviceLabel: device.label,
    expectedIntervalSec: device.expectedReportIntervalSec,
    expectedIntervalMin: roundTo(device.expectedReportIntervalSec / 60, 2),
    lastUpdateLabel: latestReading
      ? formatAgeLabel(latestReading.receivedAt, now)
      : "belum ada data",
    measuredAt: latestReading?.measuredAt ?? "",
    measuredAtLabel: latestReading
      ? formatDateTimeLabel(latestReading.measuredAt)
      : "belum ada data",
    receivedAt: latestReading?.receivedAt ?? "",
    receivedAtLabel: latestReading
      ? formatDateTimeLabel(latestReading.receivedAt)
      : "belum ada data",
    rssiDbm: latestReading?.rssiDbm ?? null,
    batteryVolt: latestReading?.batteryVolt ?? null,
    coordinate: {
      latitude: site.latitude ?? null,
      longitude: site.longitude ?? null,
      label: getCoordinateLabel(site),
      markerLeft: position.left,
      markerTop: position.top,
    },
    rawPayloadPreview: {
      distance: sensorDistanceCm,
      H_cm: fuelHeightCm,
      volume: volumeLiter,
      percent: fillPercent,
      wifi_rssi: latestReading?.rssiDbm ?? null,
    },
    readings: buildReadingSeries(tank, latestReading, readings),
    nearbySites: buildNearbySites(tank.id, {
      ...input,
      now,
    }),
  };
}

export function buildTankReadings(
  tankId: string,
  input: BuildTankDetailInput = {},
): TankReadingPoint[] {
  const detail = buildTankDetail(tankId, input);
  return detail?.readings ?? [];
}
