export type TankShape = "horizontal-cylinder" | "rectangular";

export type RuntimeStatus =
  | "unknown"
  | "critical"
  | "warning"
  | "limited"
  | "safe";

export type LevelStatus = "critical" | "low" | "warning" | "safe";

export type DeviceStatus = "unknown" | "online" | "delayed" | "offline";

export type OperationalStatus = "critical" | "warning" | "safe";

export type Site = {
  id: string;
  code: string;
  name: string;
  areaLabel: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
};

export type Tank = {
  id: string;
  siteId: string;
  name: string;
  shape: TankShape;
  capacityLiter: number;
  diameterCm?: number;
  lengthCm?: number;
  heightCm?: number;
  widthCm?: number;
  sensorMountHeightCm: number;
  lowLevelPercent: number;
  criticalLevelPercent: number;
  consumptionLiterPerHour: number;
  isActive: boolean;
};

export type Device = {
  id: string;
  siteId: string;
  tankId: string;
  code: string;
  label: string;
  expectedReportIntervalSec: number;
  isActive: boolean;
};

export type Reading = {
  id: string;
  deviceId: string;
  tankId: string;
  measuredAt: string;
  receivedAt: string;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  volumeLiter: number;
  fillPercent: number;
  runtimeHour: number;
  batteryVolt?: number;
  rssiDbm?: number;
  rawPayload?: unknown;
};

export type CatTelemetryPayload = {
  [key: string]: unknown;
  device?: unknown;
  device_id?: unknown;
  ts?: unknown;
  ts_iso?: unknown;
  distance?: unknown;
  distance_cm?: unknown;
  dist?: unknown;
  dist_cm?: unknown;
  voltage?: unknown;
  vbatt?: unknown;
  vbat?: unknown;
  h_cm?: unknown;
  H_cm?: unknown;
  volume?: unknown;
  volume_l?: unknown;
  percent?: unknown;
  rssi?: unknown;
  wifi_rssi?: unknown;
  lat?: unknown;
  lng?: unknown;
  raw?: Record<string, unknown> | null;
};

export type NormalizeReadingInput = {
  payload: CatTelemetryPayload;
  tank: Tank;
  fallbackDeviceId?: string;
  receivedAt?: Date;
  readingId?: string;
};
