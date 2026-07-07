"use server";

import { revalidatePath } from "next/cache";

import { verifyAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import {
  cleanupMonitoringTanksInMysql,
  resetMonitoringReadingsInMysql,
} from "@/features/monitoring/lib/mysql-maintenance-repository";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import { getSafeErrorMessage } from "@/lib/safe-error-message";

const DELETE_TANK_CONFIRMATION = "HAPUS DATA STO";
const RESET_TANK_READINGS_CONFIRMATION = "RESET READING STO";
const RESET_ALL_READINGS_CONFIRMATION = "RESET SEMUA READING";

export type DashboardAdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
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

function assertMysqlStorageIsReady() {
  if (getMonitoringStorageDriver() !== "mysql") {
    throw new Error("Pembersihan data STO memerlukan storage MySQL.");
  }
}

function revalidateDashboardMonitoringPages(tankId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/detail");
  if (tankId) {
    revalidatePath(`/dashboard/ringkas/tanks/${tankId}`);
  }
  revalidatePath("/dashboard/ringkas/tanks/[tankId]", "page");
  revalidatePath("/dashboard/tanks/[tankId]", "page");
  revalidatePath("/dashboard/admin/device-requests");
  revalidatePath("/dashboard/devices/request");
}

export async function cleanupDashboardTankAction(
  _state: DashboardAdminActionState,
  formData: FormData,
): Promise<DashboardAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const tankId = getRequiredFormValue(formData, "tankId");
    const siteLabel = getRequiredFormValue(formData, "siteLabel");
    const confirmation = getRequiredFormValue(formData, "confirmation");

    if (confirmation !== DELETE_TANK_CONFIRMATION) {
      throw new Error("Konfirmasi hapus data STO tidak valid.");
    }

    const result = await cleanupMonitoringTanksInMysql({ tankIds: [tankId] });

    revalidateDashboardMonitoringPages(tankId);

    if (result.matchedTankCount === 0) {
      return {
        status: "success",
        message: "Data STO sudah tidak ditemukan atau sudah dibersihkan.",
      };
    }

    return {
      status: "success",
      message: `${siteLabel} berhasil dibersihkan dari monitoring.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, {
        fallbackMessage: "Data STO belum bisa dibersihkan.",
        internalMessage:
          "Data STO belum bisa dibersihkan karena layanan database belum siap.",
      }),
    };
  }
}

export async function resetDashboardTankReadingsAction(
  _state: DashboardAdminActionState,
  formData: FormData,
): Promise<DashboardAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const tankId = getRequiredFormValue(formData, "tankId");
    const siteLabel = getRequiredFormValue(formData, "siteLabel");
    const confirmation = getRequiredFormValue(formData, "confirmation");

    if (confirmation !== RESET_TANK_READINGS_CONFIRMATION) {
      throw new Error("Konfirmasi reset reading STO tidak valid.");
    }

    const result = await resetMonitoringReadingsInMysql({ tankIds: [tankId] });

    revalidateDashboardMonitoringPages(tankId);

    if (result.matchedTankCount === 0) {
      return {
        status: "success",
        message: "Tangki sudah tidak ditemukan atau belum punya data reading.",
      };
    }

    return {
      status: "success",
      message:
        result.readingRows > 0
          ? `${siteLabel} berhasil direset. ${result.readingRows} reading dihapus.`
          : `${siteLabel} belum memiliki reading yang perlu direset.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, {
        fallbackMessage: "Reading STO belum bisa direset.",
        internalMessage:
          "Reading STO belum bisa direset karena layanan database belum siap.",
      }),
    };
  }
}

export async function resetAllDashboardReadingsAction(
  _state: DashboardAdminActionState,
  formData: FormData,
): Promise<DashboardAdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ formData, sessionId: admin.sessionId });
    assertMysqlStorageIsReady();

    const confirmation = getRequiredFormValue(formData, "confirmation");

    if (confirmation !== RESET_ALL_READINGS_CONFIRMATION) {
      throw new Error("Konfirmasi reset semua reading tidak valid.");
    }

    const result = await resetMonitoringReadingsInMysql();

    revalidateDashboardMonitoringPages();

    return {
      status: "success",
      message:
        result.readingRows > 0
          ? `${result.readingRows} reading dari ${result.matchedTankCount} tangki berhasil direset.`
          : "Belum ada reading yang perlu direset.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, {
        fallbackMessage: "Semua reading belum bisa direset.",
        internalMessage:
          "Semua reading belum bisa direset karena layanan database belum siap.",
      }),
    };
  }
}
