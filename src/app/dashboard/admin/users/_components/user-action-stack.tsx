import {
  activateAuthUserAction,
  deleteAuthUserAction,
  disableAuthUserAction,
  resendUserVerificationEmailAction,
  revokeAuthUserSessionsAction,
  sendUserPasswordResetAction,
} from "../actions";
import { AdminActionForm } from "../admin-action-controls";
import { type AuthUserDirectoryItem } from "@/features/auth/server/user-admin-service";

export function UserActionStack({
  adminId,
  csrfToken,
  user,
}: {
  adminId: string;
  csrfToken: string;
  user: AuthUserDirectoryItem;
}) {
  const isCurrentUser = user.id === adminId;
  const canUseDirectActions = user.status !== "pending";
  const canDisable =
    canUseDirectActions && !isCurrentUser && user.status === "active";
  const canActivate =
    canUseDirectActions && !isCurrentUser && user.status !== "active";
  const canRevokeSessions = canUseDirectActions && !isCurrentUser;
  const canSendReset = canUseDirectActions && !isCurrentUser;
  const canDelete = !isCurrentUser;

  if (isCurrentUser) {
    return (
      <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-500">
        Akun sendiri dikunci dari aksi admin.
      </p>
    );
  }

  return (
    <div className="inline-flex w-max flex-nowrap items-center gap-1.5 whitespace-nowrap">
      {canDisable ? (
        <AdminActionForm
          action={disableAuthUserAction}
          compact
          confirmation={{
            confirmLabel: "Ya, nonaktifkan",
            description: `${user.fullName} tidak dapat menggunakan akun ini sampai admin mengaktifkannya kembali.`,
            eyebrow: "Nonaktifkan akses pengguna",
            title: `Nonaktifkan akun ${user.fullName}?`,
            tone: "danger",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="ban"
          variant="dangerOutline"
        >
          Nonaktifkan
        </AdminActionForm>
      ) : null}

      {canActivate ? (
        <AdminActionForm
          action={activateAuthUserAction}
          compact
          confirmation={{
            confirmLabel: "Ya, aktifkan",
            description: `${user.fullName} akan kembali dapat masuk dan menggunakan fitur sesuai role yang dimilikinya.`,
            eyebrow: "Aktifkan akses pengguna",
            title: `Aktifkan kembali ${user.fullName}?`,
            tone: "primary",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="refresh"
          variant="success"
        >
          Aktifkan
        </AdminActionForm>
      ) : null}

      {canRevokeSessions ? (
        <AdminActionForm
          action={revokeAuthUserSessionsAction}
          compact
          confirmation={{
            confirmLabel: "Ya, cabut semua sesi",
            description: `${user.fullName} akan dikeluarkan dari seluruh perangkat dan harus login kembali.`,
            eyebrow: "Keamanan sesi pengguna",
            title: `Cabut semua sesi ${user.fullName}?`,
            tone: "warning",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="logout"
          variant="neutralOutline"
        >
          Cabut sesi
        </AdminActionForm>
      ) : null}

      {!user.emailVerifiedAt ? (
        <AdminActionForm
          action={resendUserVerificationEmailAction}
          compact
          confirmation={{
            confirmLabel: "Ya, kirim email",
            description: `Sistem akan mengirim tautan verifikasi baru ke ${user.email}.`,
            eyebrow: "Kirim email verifikasi",
            title: `Kirim verifikasi untuk ${user.fullName}?`,
            tone: "primary",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="send"
          variant="neutralOutline"
        >
          Kirim verifikasi
        </AdminActionForm>
      ) : null}

      {canSendReset ? (
        <AdminActionForm
          action={sendUserPasswordResetAction}
          compact
          confirmation={{
            confirmLabel: "Ya, kirim tautan",
            description: `Tautan reset password akan dikirim ke ${user.email}. Password tidak berubah sampai pengguna menyelesaikan proses tersebut.`,
            eyebrow: "Pemulihan akun pengguna",
            title: `Kirim reset password untuk ${user.fullName}?`,
            tone: "warning",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="key"
          variant="neutralOutline"
        >
          Reset password
        </AdminActionForm>
      ) : null}

      {canDelete ? (
        <AdminActionForm
          action={deleteAuthUserAction}
          compact
          confirmation={{
            confirmLabel: "Ya, hapus akun",
            description: `Akun ${user.fullName} akan dihapus permanen. Aksi ini hanya dapat dilakukan jika akun tidak memiliki jejak pengajuan perangkat.`,
            eyebrow: "Hapus akun pengguna",
            title: `Hapus ${user.fullName}?`,
            tone: "danger",
          }}
          csrfToken={csrfToken}
          fields={{ targetUserId: user.id }}
          hideMessage
          icon="trash"
          variant="dangerOutline"
        >
          Hapus
        </AdminActionForm>
      ) : null}
    </div>
  );
}
