"use server";

import { revalidatePath } from "next/cache";

import { requirePageUser } from "@/features/auth/lib/auth-guards";
import {
  createDeviceRequestInMysql,
  type CreateDeviceRequestFromMysqlResult,
} from "@/features/monitoring/lib/mysql-device-request-repository";
import { notifyAdminsDeviceRequestCreated } from "@/features/monitoring/lib/device-request-notifications";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import type {
  DeviceSensorType,
  DeviceRequestDraft,
  DeviceRequestValidationIssue,
  LoadPowerUnit,
  TankShape,
} from "@/features/monitoring/types/monitoring";

const USER_DEVICE_REQUEST_PATH = "/dashboard/devices/request";
const ADMIN_DEVICE_REQUEST_PATH = "/dashboard/admin/device-requests";

export type DeviceRequestFormState = {
  status: "idle" | "success" | "error";
  message: string;
  requestCode?: string;
  issues?: DeviceRequestValidationIssue[];
};

function getOptionalFormValue(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getRequiredFormValue(formData: FormData, key: string): string {
  const value = getOptionalFormValue(formData, key);

  if (!value) {
    throw new Error("Form pengajuan perangkat belum lengkap.");
  }

  return value;
}

function parseNumberField(formData: FormData, key: string): number | undefined {
  const value = getOptionalFormValue(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) {
    throw new Error(`Nilai ${key} harus berupa angka.`);
  }

  return parsed;
}

function parseTankShape(formData: FormData): TankShape {
  const value = getRequiredFormValue(formData, "tankShape");

  if (value === "rectangular" || value === "horizontal-cylinder") {
    return value;
  }

  throw new Error("Tipe tangki tidak valid.");
}

function parseDeviceSensorType(formData: FormData): DeviceSensorType {
  const value = getRequiredFormValue(formData, "deviceSensorType");

  if (value === "fuel" || value === "energy") {
    return value;
  }

  throw new Error("Mode sensor tidak valid.");
}

function parseLoadUnit(formData: FormData): LoadPowerUnit {
  const value = getRequiredFormValue(formData, "loadUnit");

  if (value === "kw" || value === "kva") {
    return value;
  }

  throw new Error("Satuan beban tidak valid.");
}

function buildDeviceRequestDraft(formData: FormData): DeviceRequestDraft {
  return {
    siteName: getRequiredFormValue(formData, "siteName"),
    areaLabel: getRequiredFormValue(formData, "areaLabel"),
    latitude: parseNumberField(formData, "latitude"),
    longitude: parseNumberField(formData, "longitude"),
    deviceSensorType: parseDeviceSensorType(formData),
    tankShape: parseTankShape(formData),
    capacityLiter: parseNumberField(formData, "capacityLiter") ?? 0,
    lengthCm: parseNumberField(formData, "lengthCm"),
    widthCm: parseNumberField(formData, "widthCm"),
    heightCm: parseNumberField(formData, "heightCm"),
    diameterCm: parseNumberField(formData, "diameterCm"),
    sensorMountHeightCm: parseNumberField(formData, "sensorMountHeightCm"),
    loadValue: parseNumberField(formData, "loadValue") ?? 0,
    loadUnit: parseLoadUnit(formData),
    dieselEngineCapacityKva:
      parseNumberField(formData, "dieselEngineCapacityKva") ?? 0,
    cosPhi: parseNumberField(formData, "cosPhi") ?? 0,
    hardwareProfileId: getRequiredFormValue(formData, "hardwareProfileId"),
  };
}

function getResultState(
  result: CreateDeviceRequestFromMysqlResult,
): DeviceRequestFormState {
  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      issues: result.issues,
    };
  }

  return {
    status: "success",
    message:
      "Pengajuan perangkat tersimpan. Kode perangkat dibuat otomatis dan admin akan memeriksa data sebelum paket firmware dibuat.",
    requestCode: result.request.requestCode,
    issues: result.warnings,
  };
}

function getErrorState(error: unknown): DeviceRequestFormState {
  return {
    status: "error",
    message:
      error instanceof Error
        ? error.message
        : "Pengajuan perangkat belum bisa diproses.",
  };
}

export async function createDeviceRequestAction(
  _state: DeviceRequestFormState,
  formData: FormData,
): Promise<DeviceRequestFormState> {
  const user = await requirePageUser();

  try {
    if (getMonitoringStorageDriver() !== "mysql") {
      throw new Error(
        "Pengajuan perangkat memerlukan database MySQL agar bisa ditinjau admin.",
      );
    }

    const result = await createDeviceRequestInMysql({
      draft: buildDeviceRequestDraft(formData),
      requesterEmail: user.email,
      requesterUserId: user.id,
    });

    if (result.ok) {
      await notifyAdminsDeviceRequestCreated(result.request).catch(() => undefined);
    }

    revalidatePath(USER_DEVICE_REQUEST_PATH);
    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);

    return getResultState(result);
  } catch (error) {
    return getErrorState(error);
  }
}
