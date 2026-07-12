"use server";

import { revalidatePath } from "next/cache";

import { getAppBaseUrl } from "@/features/auth/lib/auth-config";
import { verifyAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import { sendDevicePackageReadyEmail } from "@/features/monitoring/lib/device-package-email";
import {
  approveDeviceRequestInMysql,
  recordFirmwarePackageEmailDeliveryInMysql,
  refreshDevicePackageDownloadTokenInMysql,
  rejectDeviceRequestInMysql,
  reissueDevicePackageInMysql,
  revokeDeviceProvisioningInMysql,
} from "@/features/monitoring/lib/mysql-device-request-repository";
import {
  cleanupMonitoringDeviceRequestsInMysql,
  resetMonitoringDeviceDataInMysql,
} from "@/features/monitoring/lib/mysql-maintenance-repository";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import { getSafeErrorMessage } from "@/lib/safe-error-message";

const ADMIN_DEVICE_REQUEST_PATH = "/dashboard/admin/device-requests";
const USER_DEVICE_REQUEST_PATH = "/dashboard/devices/request";
const CLEANUP_SELECTED_CONFIRMATION = "BERSIHKAN PILIHAN DEVICE";
const CLEANUP_SINGLE_CONFIRMATION = "BERSIHKAN ITEM DEVICE";
const RESET_DEVICE_DATA_CONFIRMATION = "BERSIHKAN SEMUA DATA DEVICE";
const DEVICE_REQUEST_SCHEMA_COLUMNS = [
  "device_sensor_type",
  "load_value",
  "load_unit",
  "diesel_engine_capacity_kva",
  "cos_phi",
] as const;

export type DeviceRequestAdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
  downloadUrl?: string;
};

function getRequiredFormValue(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error("Data aksi admin belum lengkap.");
  }

  return value;
}

function assertValidAdminActionCsrf({
  formData,
  sessionId,
}: {
  formData: FormData;
  sessionId: string;
}) {
  const csrfToken = String(formData.get("csrfToken") ?? "");

  if (
    !verifyAdminActionCsrfToken({
      sessionId,
      token: csrfToken,
    })
  ) {
    throw new Error("Sesi admin tidak valid. Muat ulang halaman lalu coba lagi.");
  }
}

function isDeviceRequestSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("unknown column") &&
    DEVICE_REQUEST_SCHEMA_COLUMNS.some((columnName) =>
      message.includes(columnName),
    )
  );
}

function getActionError(error: unknown): DeviceRequestAdminActionState {
  if (isDeviceRequestSchemaError(error)) {
    return {
      status: "error",
      message:
        "Aksi belum bisa diproses karena struktur database Batch 19 belum lengkap. Jalankan migration device request fields lalu coba lagi.",
    };
  }

  return {
    status: "error",
    message: getSafeErrorMessage(error, {
      fallbackMessage: "Aksi pengajuan perangkat belum bisa diproses.",
      internalMessage:
        "Aksi belum bisa diproses karena layanan database belum siap. Periksa migration dan koneksi database.",
    }),
  };
}

function getActionSuccess(message: string): DeviceRequestAdminActionState {
  return {
    status: "success",
    message,
  };
}

function formatResetSummary(totalRows: number): string {
  if (totalRows === 0) {
    return "Tidak ada data operasional perangkat yang perlu dibersihkan.";
  }

  return `${totalRows} baris data operasional perangkat berhasil dibersihkan. Akun, admin, template firmware, dan profil hardware tetap disimpan.`;
}

function formatCleanupSummary({
  matchedRequestCount,
  totalRows,
}: {
  matchedRequestCount: number;
  totalRows: number;
}): string {
  if (matchedRequestCount === 0) {
    return "Tidak ada pengajuan perangkat yang cocok untuk dibersihkan.";
  }

  return `${matchedRequestCount} pengajuan perangkat dibersihkan. ${totalRows} baris data terkait dihapus tanpa menghapus akun, template firmware, atau profil hardware.`;
}

function buildDevicePackageDownloadUrl(downloadToken: string): string {
  const url = new URL("/api/device-packages/download", getAppBaseUrl());
  url.searchParams.set("token", downloadToken);
  return url.toString();
}

function assertMysqlStorageIsReady() {
  if (getMonitoringStorageDriver() !== "mysql") {
    throw new Error("Tinjauan pengajuan perangkat memerlukan storage MySQL.");
  }
}

function revalidateMonitoringDevicePages() {
  revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
  revalidatePath(USER_DEVICE_REQUEST_PATH);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ringkasan");
  revalidatePath("/dashboard/detail");
  revalidatePath("/dashboard/tanks/[tankId]", "page");
  revalidatePath("/dashboard/ringkas/tanks/[tankId]", "page");
}

function getRequestIdsFromForm(formData: FormData): string[] {
  return formData
    .getAll("requestIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function approveDeviceRequestAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const requestId = getRequiredFormValue(formData, "requestId");
    const approval = await approveDeviceRequestInMysql({
      adminUserId: admin.id,
      appBaseUrl: getAppBaseUrl(),
      requestId,
    });
    const downloadUrl = buildDevicePackageDownloadUrl(approval.downloadToken);
    const delivery = await sendDevicePackageReadyEmail({
      deviceCode: approval.request.deviceCode,
      downloadExpiresAt: approval.downloadExpiresAt,
      downloadUrl,
      email: approval.request.requesterEmail,
      requestCode: approval.request.requestCode,
      siteName: approval.request.siteName,
    });

    await recordFirmwarePackageEmailDeliveryInMysql({
      adminUserId: admin.id,
      delivered: delivery.delivered,
      delivery: delivery.delivery,
      errorReason: delivery.delivered ? undefined : delivery.reason,
      packageId: approval.package.id,
      requestId: approval.request.id,
    }).catch(() => undefined);

    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
    revalidatePath(USER_DEVICE_REQUEST_PATH);

    return {
      ...getActionSuccess(
        delivery.delivered
          ? "Pengajuan disetujui dan link firmware sudah dikirim."
          : "Pengajuan disetujui dan paket firmware dibuat, tetapi email belum terkirim.",
      ),
      downloadUrl,
    };
  } catch (error) {
    return getActionError(error);
  }
}

export async function rejectDeviceRequestAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const requestId = getRequiredFormValue(formData, "requestId");
    const rejectionReason = getRequiredFormValue(formData, "rejectionReason");

    await rejectDeviceRequestInMysql({
      adminUserId: admin.id,
      rejectionReason,
      requestId,
    });

    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
    revalidatePath(USER_DEVICE_REQUEST_PATH);

    return getActionSuccess("Pengajuan perangkat berhasil ditolak.");
  } catch (error) {
    return getActionError(error);
  }
}

async function sendPackageEmailAndRecord({
  adminUserId,
  downloadExpiresAt,
  downloadToken,
  packageId,
  request,
}: {
  adminUserId: string;
  downloadExpiresAt: string;
  downloadToken: string;
  packageId: string;
  request: {
    deviceCode: string;
    id: string;
    requesterEmail: string;
    requestCode: string;
    siteName: string;
  };
}): Promise<{
  delivered: boolean;
  downloadUrl: string;
}> {
  const downloadUrl = buildDevicePackageDownloadUrl(downloadToken);
  const delivery = await sendDevicePackageReadyEmail({
    deviceCode: request.deviceCode,
    downloadExpiresAt,
    downloadUrl,
    email: request.requesterEmail,
    requestCode: request.requestCode,
    siteName: request.siteName,
  });

  await recordFirmwarePackageEmailDeliveryInMysql({
    adminUserId,
    delivered: delivery.delivered,
    delivery: delivery.delivery,
    errorReason: delivery.delivered ? undefined : delivery.reason,
    packageId,
    requestId: request.id,
  }).catch(() => undefined);

  return {
    delivered: delivery.delivered,
    downloadUrl,
  };
}

export async function resendDevicePackageAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const requestId = getRequiredFormValue(formData, "requestId");
    const refresh = await refreshDevicePackageDownloadTokenInMysql({
      adminUserId: admin.id,
      requestId,
    });
    const email = await sendPackageEmailAndRecord({
      adminUserId: admin.id,
      downloadExpiresAt: refresh.downloadExpiresAt,
      downloadToken: refresh.downloadToken,
      packageId: refresh.package.id,
      request: refresh.request,
    });

    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
    revalidatePath(USER_DEVICE_REQUEST_PATH);

    return {
      ...getActionSuccess(
        email.delivered
          ? "Link firmware baru sudah dikirim ke email pengaju."
          : "Link firmware baru dibuat, tetapi email belum terkirim.",
      ),
      downloadUrl: email.downloadUrl,
    };
  } catch (error) {
    return getActionError(error);
  }
}

export async function reissueDevicePackageAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const requestId = getRequiredFormValue(formData, "requestId");
    const reissue = await reissueDevicePackageInMysql({
      adminUserId: admin.id,
      appBaseUrl: getAppBaseUrl(),
      requestId,
    });
    const email = await sendPackageEmailAndRecord({
      adminUserId: admin.id,
      downloadExpiresAt: reissue.downloadExpiresAt,
      downloadToken: reissue.downloadToken,
      packageId: reissue.package.id,
      request: reissue.request,
    });

    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
    revalidatePath(USER_DEVICE_REQUEST_PATH);

    return {
      ...getActionSuccess(
        email.delivered
          ? "Paket firmware dan key baru sudah dibuat lalu dikirim ke email pengaju."
          : "Paket firmware dan key baru sudah dibuat, tetapi email belum terkirim.",
      ),
      downloadUrl: email.downloadUrl,
    };
  } catch (error) {
    return getActionError(error);
  }
}

export async function revokeDeviceProvisioningAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const requestId = getRequiredFormValue(formData, "requestId");

    await revokeDeviceProvisioningInMysql({
      adminUserId: admin.id,
      requestId,
    });

    revalidatePath(ADMIN_DEVICE_REQUEST_PATH);
    revalidatePath(USER_DEVICE_REQUEST_PATH);
    revalidatePath("/dashboard");

    return getActionSuccess("Akses perangkat berhasil dicabut.");
  } catch (error) {
    return getActionError(error);
  }
}

export async function resetMonitoringDeviceDataAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const confirmation = getRequiredFormValue(formData, "confirmation");

    if (confirmation !== RESET_DEVICE_DATA_CONFIRMATION) {
      throw new Error(
        `Ketik ${RESET_DEVICE_DATA_CONFIRMATION} untuk membersihkan data perangkat uji.`,
      );
    }

    const result = await resetMonitoringDeviceDataInMysql();

    revalidateMonitoringDevicePages();

    return getActionSuccess(formatResetSummary(result.totalRows));
  } catch (error) {
    return getActionError(error);
  }
}

export async function cleanupDeviceRequestsAction(
  _state: DeviceRequestAdminActionState,
  formData: FormData,
): Promise<DeviceRequestAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const cleanupMode = getRequiredFormValue(formData, "cleanupMode");
    const requestIds = getRequestIdsFromForm(formData);

    if (requestIds.length === 0) {
      throw new Error("Pilih minimal satu pengajuan perangkat untuk dibersihkan.");
    }

    if (cleanupMode === "single") {
      const confirmation = getRequiredFormValue(formData, "confirmation");

      if (
        requestIds.length !== 1 ||
        confirmation !== CLEANUP_SINGLE_CONFIRMATION
      ) {
        throw new Error("Aksi pembersihan satu perangkat tidak valid.");
      }
    } else if (cleanupMode === "selected") {
      const confirmation = getRequiredFormValue(formData, "confirmation");

      if (confirmation !== CLEANUP_SELECTED_CONFIRMATION) {
        throw new Error(
          `Ketik ${CLEANUP_SELECTED_CONFIRMATION} untuk membersihkan pengajuan yang dipilih.`,
        );
      }
    } else {
      throw new Error("Mode pembersihan perangkat tidak valid.");
    }

    const result = await cleanupMonitoringDeviceRequestsInMysql({ requestIds });

    revalidateMonitoringDevicePages();

    return getActionSuccess(formatCleanupSummary(result));
  } catch (error) {
    return getActionError(error);
  }
}
