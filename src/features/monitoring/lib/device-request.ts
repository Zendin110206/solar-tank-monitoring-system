import { randomBytes } from "node:crypto";

import type {
  DeviceSensorType,
  DeviceRequestCapacityCheck,
  DeviceRequestDraft,
  DeviceRequestStatus,
  DeviceRequestValidationIssue,
  LoadPowerUnit,
  MonitoringDeviceRequest,
  MonitoringFirmwareTemplate,
  MonitoringHardwareProfile,
  NormalizedDeviceRequestDraft,
  TankShape,
} from "../types/monitoring";
import { roundTo } from "./number";

const DEFAULT_LOW_LEVEL_PERCENT = 30;
const DEFAULT_CRITICAL_LEVEL_PERCENT = 15;
const DEFAULT_DEVICE_SENSOR_TYPE: DeviceSensorType = "fuel";
const GENSET_LOAD_LITER_PER_KWH = 0.21;
const DEFAULT_CAPACITY_TOLERANCE_PERCENT = 5;
const DEFAULT_CAPACITY_TOLERANCE_LITER = 5;
const REQUEST_CODE_RANDOM_BYTES = 3;
const GENERATED_DEVICE_CODE_RANDOM_BYTES = 3;
const MONITORING_ID_RANDOM_BYTES = 18;

type DeviceRequestValidationOptions = {
  capacityToleranceLiter?: number;
  capacityTolerancePercent?: number;
  firmwareTemplates?: MonitoringFirmwareTemplate[];
  hardwareProfiles?: MonitoringHardwareProfile[];
};

type DeviceRequestValidationResult = {
  ok: boolean;
  errors: DeviceRequestValidationIssue[];
  warnings: DeviceRequestValidationIssue[];
  normalized: NormalizedDeviceRequestDraft | null;
  capacityCheck: DeviceRequestCapacityCheck | null;
};

type BuildPendingDeviceRequestInput = DeviceRequestValidationOptions & {
  draft: DeviceRequestDraft;
  requesterEmail: string;
  requesterUserId: string;
  now?: Date;
};

type BuildPendingDeviceRequestResult =
  | {
      ok: true;
      request: MonitoringDeviceRequest;
      validation: DeviceRequestValidationResult;
    }
  | {
      ok: false;
      validation: DeviceRequestValidationResult;
    };

function createMonitoringId(prefix: string): string {
  return `${prefix}_${randomBytes(MONITORING_ID_RANDOM_BYTES).toString("base64url")}`;
}

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSiteCode(value: string): string {
  return normalizeSpaces(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDeviceCode(value: string): string {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDeviceSensorType(value: unknown): DeviceSensorType {
  return value === "energy" || value === "fuel"
    ? value
    : DEFAULT_DEVICE_SENSOR_TYPE;
}

function normalizeLoadPowerUnit(value: unknown): LoadPowerUnit {
  return value === "kva" || value === "kw" ? value : "kw";
}

function normalizeOptionalText(value?: string | null): string | null {
  const cleanValue = value ? normalizeSpaces(value) : "";
  return cleanValue || null;
}

function normalizePositiveNumber(value?: number | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function normalizePercent(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeCosPhi(value?: number | null): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 1
    ? value
    : undefined;
}

function createIssue(
  field: string,
  message: string,
  severity: DeviceRequestValidationIssue["severity"] = "error",
): DeviceRequestValidationIssue {
  return {
    field,
    message,
    severity,
  };
}

function isValidCoordinate(value: number | undefined, min: number, max: number): boolean {
  return typeof value === "undefined" || (value >= min && value <= max);
}

function calculateRectangularCapacityLiter({
  heightCm,
  lengthCm,
  widthCm,
}: {
  heightCm?: number;
  lengthCm?: number;
  widthCm?: number;
}): number | null {
  if (!heightCm || !lengthCm || !widthCm) {
    return null;
  }

  return roundTo((heightCm * lengthCm * widthCm) / 1000, 2);
}

function calculateHorizontalCylinderCapacityLiter({
  diameterCm,
  lengthCm,
}: {
  diameterCm?: number;
  lengthCm?: number;
}): number | null {
  if (!diameterCm || !lengthCm) {
    return null;
  }

  const radiusCm = diameterCm / 2;
  return roundTo((Math.PI * radiusCm * radiusCm * lengthCm) / 1000, 2);
}

export function calculateDeviceRequestCapacityLiter(
  draft: Pick<
    NormalizedDeviceRequestDraft,
    "diameterCm" | "heightCm" | "lengthCm" | "tankShape" | "widthCm"
  >,
): number | null {
  if (draft.tankShape === "rectangular") {
    return calculateRectangularCapacityLiter(draft);
  }

  return calculateHorizontalCylinderCapacityLiter(draft);
}

export function evaluateDeviceRequestCapacity({
  calculatedCapacityLiter,
  capacityToleranceLiter = DEFAULT_CAPACITY_TOLERANCE_LITER,
  capacityTolerancePercent = DEFAULT_CAPACITY_TOLERANCE_PERCENT,
  declaredCapacityLiter,
}: {
  calculatedCapacityLiter: number | null;
  capacityToleranceLiter?: number;
  capacityTolerancePercent?: number;
  declaredCapacityLiter: number;
}): DeviceRequestCapacityCheck {
  if (!calculatedCapacityLiter || calculatedCapacityLiter <= 0) {
    return {
      calculatedCapacityLiter: null,
      declaredCapacityLiter,
      differenceLiter: null,
      differencePercent: null,
      isConsistent: false,
    };
  }

  const differenceLiter = roundTo(
    Math.abs(declaredCapacityLiter - calculatedCapacityLiter),
    2,
  );
  const differencePercent = roundTo(
    (differenceLiter / calculatedCapacityLiter) * 100,
    2,
  );

  return {
    calculatedCapacityLiter,
    declaredCapacityLiter,
    differenceLiter,
    differencePercent,
    isConsistent:
      differenceLiter <= capacityToleranceLiter ||
      differencePercent <= capacityTolerancePercent,
  };
}

export function isTankShapeSupportedByHardwareProfile({
  profile,
  tankShape,
}: {
  profile: MonitoringHardwareProfile;
  tankShape: TankShape;
}): boolean {
  return (
    profile.supportedTankShape === "any" ||
    profile.supportedTankShape === tankShape
  );
}

export function getDeviceSensorTypeLabel(sensorType: DeviceSensorType): string {
  switch (sensorType) {
    case "energy":
      return "Sensor energy";
    case "fuel":
      return "Sensor fuel";
  }
}

export function createSiteCodeFromName({
  areaLabel,
  siteName,
}: {
  areaLabel?: string | null;
  siteName?: string | null;
}): string {
  const cleanSiteName = normalizeSpaces(siteName ?? "")
    .replace(/^STO\s+/i, "")
    .replace(/\bSTO\b/gi, "");
  const baseValue = cleanSiteName || normalizeSpaces(areaLabel ?? "");
  const code = normalizeSiteCode(baseValue).slice(0, 24);

  return code || "STO";
}

export function createGeneratedDeviceCode({
  siteCode,
}: {
  siteCode: string;
}): string {
  const safeSiteCode =
    normalizeDeviceCode(siteCode).replace(/^sto-?/, "") || "sto";
  const randomPart = randomBytes(GENERATED_DEVICE_CODE_RANDOM_BYTES)
    .toString("hex")
    .toLowerCase();

  return normalizeDeviceCode(`device-${safeSiteCode}-${randomPart}`);
}

export function calculateOperationalLoadKw({
  cosPhi,
  loadUnit,
  loadValue,
}: {
  cosPhi: number;
  loadUnit: LoadPowerUnit;
  loadValue: number;
}): number {
  return roundTo(loadUnit === "kva" ? loadValue * cosPhi : loadValue, 2);
}

export function calculateOperationalConsumptionLiterPerHour({
  cosPhi,
  dieselEngineCapacityKva,
  loadUnit,
  loadValue,
}: {
  cosPhi: number;
  dieselEngineCapacityKva: number;
  loadUnit: LoadPowerUnit;
  loadValue: number;
}): number {
  const effectiveLoadKw = calculateOperationalLoadKw({
    cosPhi,
    loadUnit,
    loadValue,
  });
  const engineCapacityKw = dieselEngineCapacityKva * cosPhi;

  if (engineCapacityKw <= 0) {
    return 0;
  }

  const loadRatio = effectiveLoadKw / engineCapacityKw;
  const loadConsumption =
    dieselEngineCapacityKva * loadRatio * GENSET_LOAD_LITER_PER_KWH;

  return roundTo(Math.max(0, loadConsumption), 2);
}

export function createDeviceRequestCode({
  now = new Date(),
  siteCode,
}: {
  now?: Date;
  siteCode: string;
}): string {
  const safeSiteCode = normalizeSiteCode(siteCode) || "STO";
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomBytes(REQUEST_CODE_RANDOM_BYTES)
    .toString("hex")
    .toUpperCase();

  return `REQ-${safeSiteCode}-${datePart}-${randomPart}`;
}

export function createDeviceRequestId(): string {
  return createMonitoringId("device_request");
}

export function createFirmwarePackageId(): string {
  return createMonitoringId("device_package");
}

export function validateDeviceRequestDraft(
  draft: DeviceRequestDraft,
  options: DeviceRequestValidationOptions = {},
): DeviceRequestValidationResult {
  const errors: DeviceRequestValidationIssue[] = [];
  const warnings: DeviceRequestValidationIssue[] = [];
  const siteName = normalizeOptionalText(draft.siteName);
  const areaLabel = normalizeOptionalText(draft.areaLabel);
  const explicitSiteCode = normalizeOptionalText(draft.siteCode);
  const siteCode = normalizeSiteCode(
    explicitSiteCode ?? createSiteCodeFromName({ areaLabel, siteName }),
  );
  const deviceSensorType = normalizeDeviceSensorType(draft.deviceSensorType);
  const explicitDeviceCode = normalizeOptionalText(draft.deviceCode);
  const deviceCode = normalizeDeviceCode(
    explicitDeviceCode ?? createGeneratedDeviceCode({ siteCode }),
  );
  const lengthCm = normalizePositiveNumber(draft.lengthCm);
  const widthCm = normalizePositiveNumber(draft.widthCm);
  const heightCm = normalizePositiveNumber(draft.heightCm);
  const diameterCm = normalizePositiveNumber(draft.diameterCm);
  const loadValue = normalizePositiveNumber(draft.loadValue);
  const loadUnit = normalizeLoadPowerUnit(draft.loadUnit);
  const dieselEngineCapacityKva = normalizePositiveNumber(
    draft.dieselEngineCapacityKva,
  );
  const cosPhi = normalizeCosPhi(draft.cosPhi);
  const lowLevelPercent = normalizePercent(null, DEFAULT_LOW_LEVEL_PERCENT);
  const criticalLevelPercent = normalizePercent(
    null,
    DEFAULT_CRITICAL_LEVEL_PERCENT,
  );
  const consumptionLiterPerHour =
    loadValue && dieselEngineCapacityKva && cosPhi
      ? calculateOperationalConsumptionLiterPerHour({
          cosPhi,
          dieselEngineCapacityKva,
          loadUnit,
          loadValue,
        })
      : 0;
  const capacityLiter = calculateDeviceRequestCapacityLiter({
    tankShape: draft.tankShape,
    lengthCm,
    widthCm,
    heightCm,
    diameterCm,
  });

  if (!siteName) {
    errors.push(createIssue("siteName", "Nama STO wajib diisi."));
  }

  if (!areaLabel) {
    errors.push(createIssue("areaLabel", "Wilayah STO wajib diisi."));
  }

  if (deviceCode && deviceCode.length < 4) {
    errors.push(
      createIssue("deviceCode", "Kode perangkat minimal 4 karakter."),
    );
  }

  if (deviceSensorType !== "fuel") {
    errors.push(
      createIssue(
        "deviceSensorType",
        "Mode sensor energy belum aktif di paket firmware saat ini. Gunakan Sensor fuel dulu.",
      ),
    );
  }

  if (!isValidCoordinate(draft.latitude ?? undefined, -90, 90)) {
    errors.push(
      createIssue("latitude", "Latitude harus berada di rentang -90 sampai 90."),
    );
  }

  if (!isValidCoordinate(draft.longitude ?? undefined, -180, 180)) {
    errors.push(
      createIssue(
        "longitude",
        "Longitude harus berada di rentang -180 sampai 180.",
      ),
    );
  }

  if (draft.tankShape === "rectangular") {
    if (!lengthCm) {
      errors.push(createIssue("lengthCm", "Tangki balok wajib memiliki panjang."));
    }

    if (!widthCm) {
      errors.push(createIssue("widthCm", "Tangki balok wajib memiliki lebar."));
    }

    if (!heightCm) {
      errors.push(createIssue("heightCm", "Tangki balok wajib memiliki tinggi."));
    }
  } else if (draft.tankShape === "horizontal-cylinder") {
    if (!lengthCm) {
      errors.push(
        createIssue("lengthCm", "Tangki silinder wajib memiliki panjang."),
      );
    }

    if (!diameterCm) {
      errors.push(
        createIssue("diameterCm", "Tangki silinder wajib memiliki diameter."),
      );
    }
  } else {
    errors.push(createIssue("tankShape", "Tipe tangki tidak dikenal."));
  }

  if (!capacityLiter) {
    errors.push(
      createIssue(
        "capacityLiter",
        "Kapasitas tangki belum bisa dihitung. Lengkapi dimensi tangki.",
      ),
    );
  }

  const inferredSensorMountHeightCm =
    normalizePositiveNumber(draft.sensorMountHeightCm) ??
    (draft.tankShape === "rectangular" ? heightCm : diameterCm);

  if (!inferredSensorMountHeightCm) {
    errors.push(
      createIssue(
        "sensorMountHeightCm",
        "Tinggi acuan sensor wajib tersedia dari input atau dimensi tangki.",
      ),
    );
  }

  if (!loadValue) {
    errors.push(
      createIssue(
        "loadValue",
        "Beban lokasi wajib diisi lebih dari 0 agar konsumsi bahan bakar per jam bisa dihitung.",
      ),
    );
  }

  if (!dieselEngineCapacityKva) {
    errors.push(
      createIssue(
        "dieselEngineCapacityKva",
        "Kapasitas diesel engine wajib diisi lebih dari 0 kVA.",
      ),
    );
  }

  if (!cosPhi) {
    errors.push(
      createIssue("cosPhi", "Cos phi wajib diisi dengan angka lebih dari 0 sampai 1."),
    );
  }

  if (loadValue && dieselEngineCapacityKva && cosPhi) {
    const effectiveLoadKw = calculateOperationalLoadKw({
      cosPhi,
      loadUnit,
      loadValue,
    });
    const engineCapacityKw = roundTo(dieselEngineCapacityKva * cosPhi, 2);

    if (effectiveLoadKw > engineCapacityKw * 1.05) {
      warnings.push(
        createIssue(
          "loadValue",
          "Beban lokasi terlihat lebih besar dari kapasitas diesel engine. Admin perlu konfirmasi sebelum approve.",
          "warning",
        ),
      );
    }
  }

  const hardwareProfile = options.hardwareProfiles?.find(
    (profile) => profile.id === draft.hardwareProfileId,
  );

  if (options.hardwareProfiles && !hardwareProfile) {
    errors.push(
      createIssue(
        "hardwareProfileId",
        "Profil hardware tidak ditemukan atau belum tersedia.",
      ),
    );
  }

  if (hardwareProfile) {
    if (!hardwareProfile.isActive) {
      errors.push(
        createIssue(
          "hardwareProfileId",
          "Profil hardware belum aktif untuk pengajuan perangkat.",
        ),
      );
    }

    if (
      !isTankShapeSupportedByHardwareProfile({
        profile: hardwareProfile,
        tankShape: draft.tankShape,
      })
    ) {
      errors.push(
        createIssue(
          "hardwareProfileId",
          "Profil hardware tidak sesuai dengan tipe tangki yang dipilih.",
        ),
      );
    }

    const firmwareTemplate = options.firmwareTemplates?.find(
      (template) => template.id === hardwareProfile.firmwareTemplateId,
    );

    if (options.firmwareTemplates && !firmwareTemplate) {
      errors.push(
        createIssue(
          "firmwareTemplateId",
          "Template firmware untuk hardware profile belum ditemukan.",
        ),
      );
    }

    if (firmwareTemplate && !firmwareTemplate.isActive) {
      errors.push(
        createIssue(
          "firmwareTemplateId",
          "Template firmware belum aktif untuk membuat paket perangkat.",
        ),
      );
    }
  }

  const normalized: NormalizedDeviceRequestDraft | null =
    siteCode &&
    siteName &&
    areaLabel &&
    deviceCode &&
    capacityLiter &&
    loadValue &&
    dieselEngineCapacityKva &&
    cosPhi
      ? {
          siteCode,
          siteName,
          areaLabel,
          deviceCode,
          deviceLabel:
            normalizeOptionalText(draft.deviceLabel) ??
            `${getDeviceSensorTypeLabel(deviceSensorType)} ${siteName}`,
          deviceSensorType,
          tankShape: draft.tankShape,
          capacityLiter,
          ...(typeof draft.latitude === "number" ? { latitude: draft.latitude } : {}),
          ...(typeof draft.longitude === "number"
            ? { longitude: draft.longitude }
            : {}),
          ...(typeof lengthCm === "number" ? { lengthCm } : {}),
          ...(draft.tankShape === "rectangular" && typeof widthCm === "number"
            ? { widthCm }
            : {}),
          ...(draft.tankShape === "rectangular" && typeof heightCm === "number"
            ? { heightCm }
            : {}),
          ...(draft.tankShape === "horizontal-cylinder" &&
          typeof diameterCm === "number"
            ? { diameterCm }
            : {}),
          sensorMountHeightCm: inferredSensorMountHeightCm ?? 0,
          loadValue,
          loadUnit,
          dieselEngineCapacityKva,
          cosPhi,
          lowLevelPercent,
          criticalLevelPercent,
          consumptionLiterPerHour,
          hardwareProfileId: draft.hardwareProfileId,
        }
      : null;

  const capacityCheck =
    normalized && capacityLiter
      ? evaluateDeviceRequestCapacity({
          calculatedCapacityLiter: capacityLiter,
          capacityToleranceLiter: options.capacityToleranceLiter,
          capacityTolerancePercent: options.capacityTolerancePercent,
          declaredCapacityLiter: capacityLiter,
        })
      : null;

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalized: errors.length === 0 ? normalized : null,
    capacityCheck,
  };
}

export function buildPendingDeviceRequest({
  draft,
  firmwareTemplates,
  hardwareProfiles = [],
  now = new Date(),
  requesterEmail,
  requesterUserId,
  ...validationOptions
}: BuildPendingDeviceRequestInput): BuildPendingDeviceRequestResult {
  const validation = validateDeviceRequestDraft(draft, {
    ...validationOptions,
    firmwareTemplates,
    hardwareProfiles,
  });
  const errors = [...validation.errors];
  const normalizedRequesterUserId = requesterUserId.trim();
  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase();

  if (!normalizedRequesterUserId) {
    errors.push(createIssue("requesterUserId", "User pengaju wajib tersedia."));
  }

  if (!normalizedRequesterEmail) {
    errors.push(createIssue("requesterEmail", "Email user pengaju wajib tersedia."));
  }

  if (!validation.ok || !validation.normalized || errors.length > 0) {
    return {
      ok: false,
      validation: {
        ...validation,
        errors,
        ok: false,
        normalized: null,
      },
    };
  }

  const hardwareProfile = hardwareProfiles.find(
    (profile) => profile.id === validation.normalized?.hardwareProfileId,
  );

  if (!hardwareProfile) {
    return {
      ok: false,
      validation: {
        ...validation,
        errors: [
          ...validation.errors,
          createIssue(
            "hardwareProfileId",
            "Profil hardware wajib tersedia sebelum request dibuat.",
          ),
        ],
        ok: false,
        normalized: null,
      },
    };
  }

  const createdAt = now.toISOString();
  const request: MonitoringDeviceRequest = {
    ...validation.normalized,
    id: createDeviceRequestId(),
    requestCode: createDeviceRequestCode({
      now,
      siteCode: validation.normalized.siteCode,
    }),
    requesterUserId: normalizedRequesterUserId,
    requesterEmail: normalizedRequesterEmail,
    status: "pending_admin_review",
    firmwareTemplateId: hardwareProfile.firmwareTemplateId,
    adminReviewedByUserId: null,
    adminReviewedAt: null,
    rejectionReason: null,
    validationWarnings: validation.warnings,
    createdAt,
    updatedAt: createdAt,
  };

  return {
    ok: true,
    request,
    validation,
  };
}

export function getDeviceRequestStatusLabel(status: DeviceRequestStatus): string {
  switch (status) {
    case "pending_admin_review":
      return "Menunggu admin";
    case "rejected":
      return "Ditolak";
    case "approved_waiting_package":
      return "Disetujui, menunggu paket firmware";
    case "approved_package_ready":
      return "Paket firmware siap";
    case "waiting_firmware_download":
      return "Menunggu download firmware";
    case "waiting_first_valid_ping":
      return "Menunggu perangkat online";
    case "active":
      return "Perangkat aktif";
    case "expired":
      return "Kedaluwarsa";
    case "revoked":
      return "Dicabut";
    case "package_generation_failed":
      return "Pembuatan paket gagal";
  }
}
