"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isAuthRole } from "@/features/auth/types";
import { verifyAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import {
  sendEmailVerificationForUserId,
  sendPasswordResetForUserId,
} from "@/features/auth/lib/auth-service";
import {
  approveAccessRequest,
  recordAuthAuditEvent,
  rejectAccessRequest,
  revokeAllUserSessions,
  setAuthUserStatus,
  updateAuthUserRole,
} from "@/features/auth/lib/mysql-auth-repository";
import { getSafeErrorMessage } from "@/lib/safe-error-message";

const ADMIN_USERS_PATH = "/dashboard/admin/users";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function getRequiredFormValue(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error("Data aksi admin tidak lengkap.");
  }

  return value;
}

function getAdminActionError(error: unknown): AdminActionState {
  return {
    status: "error",
    message: getSafeErrorMessage(error, {
      fallbackMessage: "Aksi admin belum bisa diproses.",
      internalMessage:
        "Aksi admin belum bisa diproses karena layanan sedang disiapkan. Periksa koneksi database dan konfigurasi email.",
    }),
  };
}

function getAdminActionSuccess(message: string): AdminActionState {
  return {
    status: "success",
    message,
  };
}

function assertValidAdminActionCsrf({
  sessionId,
  formData,
}: {
  sessionId: string;
  formData: FormData;
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

export async function approveAccessRequestAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const accessRequestId = getRequiredFormValue(formData, "accessRequestId");

    await approveAccessRequest({
      accessRequestId,
      adminUserId: admin.id,
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "access_request_approved",
      metadata: { accessRequestId },
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Pengajuan akses berhasil disetujui.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function rejectAccessRequestAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const accessRequestId = getRequiredFormValue(formData, "accessRequestId");

    await rejectAccessRequest({
      accessRequestId,
      adminUserId: admin.id,
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "access_request_rejected",
      metadata: { accessRequestId },
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Pengajuan akses berhasil ditolak.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function changeAuthUserRoleAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");
    const roleValue = getRequiredFormValue(formData, "role");

    if (!isAuthRole(roleValue)) {
      throw new Error("Role pengguna tidak valid.");
    }

    if (targetUserId === admin.id && roleValue !== "admin") {
      throw new Error("Admin tidak bisa menurunkan role akun sendiri.");
    }

    await updateAuthUserRole({
      targetUserId,
      role: roleValue,
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_role_changed",
      targetUserId,
      metadata: { role: roleValue },
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Role pengguna berhasil diperbarui.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function activateAuthUserAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");

    await setAuthUserStatus({
      targetUserId,
      status: "active",
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_activated",
      targetUserId,
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Pengguna berhasil diaktifkan.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function disableAuthUserAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");

    if (targetUserId === admin.id) {
      throw new Error("Admin tidak bisa menonaktifkan akun sendiri.");
    }

    await setAuthUserStatus({
      targetUserId,
      status: "disabled",
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_disabled",
      targetUserId,
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Pengguna berhasil dinonaktifkan.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function revokeAuthUserSessionsAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");

    if (targetUserId === admin.id) {
      throw new Error("Cabut sesi akun sendiri dilakukan lewat tombol keluar.");
    }

    await revokeAllUserSessions(targetUserId);
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_sessions_revoked",
      targetUserId,
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Semua sesi pengguna berhasil dicabut.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function resendUserVerificationEmailAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");

    await sendEmailVerificationForUserId({
      userId: targetUserId,
      request: { headers: await headers() },
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_verification_email_resent",
      targetUserId,
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Email verifikasi berhasil dikirim.");
  } catch (error) {
    return getAdminActionError(error);
  }
}

export async function sendUserPasswordResetAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePageAdmin();

  try {
    assertValidAdminActionCsrf({ sessionId: admin.sessionId, formData });
    const targetUserId = getRequiredFormValue(formData, "targetUserId");

    if (targetUserId === admin.id) {
      throw new Error("Reset password akun sendiri dilakukan dari keamanan akun.");
    }

    await sendPasswordResetForUserId({
      userId: targetUserId,
      request: { headers: await headers() },
    });
    await recordAuthAuditEvent({
      actorUserId: admin.id,
      eventType: "auth_user_password_reset_sent",
      targetUserId,
    }).catch(() => undefined);

    revalidatePath(ADMIN_USERS_PATH);

    return getAdminActionSuccess("Link reset password berhasil dikirim.");
  } catch (error) {
    return getAdminActionError(error);
  }
}
