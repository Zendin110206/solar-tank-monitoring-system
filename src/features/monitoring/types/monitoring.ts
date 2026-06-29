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

export type ReadingValueSource = "device" | "backend" | "server" | "unknown";

export type TankConfigSource = "registry" | "payload" | "mixed";

export type TankConfigStatus =
  | "normal"
  | "minor_config_difference"
  | "config_mismatch"
  | "invalid_config"
  | "needs_review";

export type TankConfigIssueSeverity = "info" | "warning" | "mismatch" | "invalid";

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

export type TankConfigSnapshot = {
  shape?: TankShape;
  capacityLiter?: number;
  diameterCm?: number;
  lengthCm?: number;
  heightCm?: number;
  widthCm?: number;
  sensorMountHeightCm?: number;
  lowLevelPercent?: number;
  criticalLevelPercent?: number;
  consumptionLiterPerHour?: number;
};

export type TankConfigIssue = {
  field: keyof TankConfigSnapshot | "shape_raw";
  label: string;
  severity: TankConfigIssueSeverity;
  registryValue: string;
  payloadValue: string;
  message: string;
};

export type TankConfigReview = {
  status: TankConfigStatus;
  configSource: TankConfigSource;
  needsReview: boolean;
  summaryLabel: string;
  reasons: string[];
  issues: TankConfigIssue[];
  registryTankConfig: TankConfigSnapshot;
  payloadTankConfig: TankConfigSnapshot | null;
  appliedTankConfig: TankConfigSnapshot;
};

export type ReadingQuality = {
  measuredAtSource: ReadingValueSource;
  fuelHeightSource: ReadingValueSource;
  volumeSource: ReadingValueSource;
  fillPercentSource: ReadingValueSource;
  runtimeSource: ReadingValueSource;
  configSource: TankConfigSource;
  configStatus: TankConfigStatus;
  needsReview: boolean;
  warnings: string[];
  configMismatchReasons: string[];
};

export type Device = {
  id: string;
  siteId: string;
  tankId: string;
  code: string;
  label: string;
  expectedReportIntervalSec: number;
  apiKeyHash?: string | null;
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
  quality?: ReadingQuality;
};

export type CatTelemetryPayload = {
  [key: string]: unknown;
  device?: unknown;
  device_id?: unknown;
  measuredAt?: unknown;
  measured_at?: unknown;
  ts?: unknown;
  ts_iso?: unknown;
  tank_shape?: unknown;
  shape?: unknown;
  capacity_liter?: unknown;
  capacityLiter?: unknown;
  length_cm?: unknown;
  lengthCm?: unknown;
  width_cm?: unknown;
  widthCm?: unknown;
  height_cm?: unknown;
  heightCm?: unknown;
  diameter_cm?: unknown;
  diameterCm?: unknown;
  sensor_mount_height_cm?: unknown;
  sensorMountHeightCm?: unknown;
  low_level_percent?: unknown;
  lowLevelPercent?: unknown;
  critical_level_percent?: unknown;
  criticalLevelPercent?: unknown;
  consumption_liter_per_hour?: unknown;
  consumptionLiterPerHour?: unknown;
  distance?: unknown;
  distance_cm?: unknown;
  dist?: unknown;
  dist_cm?: unknown;
  voltage?: unknown;
  vbatt?: unknown;
  vbat?: unknown;
  h_cm?: unknown;
  H_cm?: unknown;
  local_H_cm?: unknown;
  volume?: unknown;
  volume_l?: unknown;
  volume_liter?: unknown;
  local_volume_l?: unknown;
  percent?: unknown;
  fill_percent?: unknown;
  local_percent?: unknown;
  rssi?: unknown;
  wifi_rssi?: unknown;
  ip?: unknown;
  lat?: unknown;
  lng?: unknown;
  tank?: Record<string, unknown> | null;
  local_result?: Record<string, unknown> | null;
  raw?: Record<string, unknown> | null;
};

export type NormalizeReadingInput = {
  payload: CatTelemetryPayload;
  tank: Tank;
  fallbackDeviceId?: string;
  receivedAt?: Date;
  readingId?: string;
};
