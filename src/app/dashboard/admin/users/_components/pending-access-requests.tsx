import {
  approveAccessRequestAction,
  rejectAccessRequestAction,
  resendUserVerificationEmailAction,
} from "../actions";
import { AdminActionForm } from "../admin-action-controls";
import { listPendingAccessRequests } from "@/features/auth/server/user-admin-service";
import { type AuthRole } from "@/features/auth/types/auth";
import { Clock3, UserRound } from "lucide-react";
import { formatDate } from "./users-page-state";

function getRoleLabel(role: AuthRole) {
  return role === "admin" ? "Admin" : "User";
}

export function PendingAccessRequests({
  accessRequests,
  csrfToken,
}: {
  accessRequests: Awaited<ReturnType<typeof listPendingAccessRequests>>;
  csrfToken: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">
            Perlu review
          </p>
          <h2 className="mt-0.5 text-base font-semibold">
            Pengajuan akses pending
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
          <Clock3 className="size-4" aria-hidden="true" />
          {accessRequests.length} pending
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {accessRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            Belum ada pengajuan akses baru.
          </div>
        ) : (
          <div className="grid gap-2">
            {accessRequests.map((request) => (
              <article
                className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-center"
                key={request.id}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-zinc-200">
                      <UserRound className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-950">
                        {request.user.fullName}
                      </h3>
                      <p className="truncate text-xs text-zinc-500">
                        {request.user.email} / @{request.user.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-3">
                    <p>
                      Role:{" "}
                      <span className="font-semibold text-zinc-950">
                        {getRoleLabel(request.requestedRole)}
                      </span>
                    </p>
                    <p>Diajukan: {formatDate(request.createdAt)}</p>
                    <p>
                      Email:{" "}
                      {request.user.emailVerifiedAt
                        ? "terverifikasi"
                        : "belum verifikasi"}
                    </p>
                  </div>
                  {request.accessReason ? (
                    <p className="mt-2 truncate text-sm text-zinc-600">
                      <span className="font-semibold text-zinc-950">
                        Alasan:
                      </span>{" "}
                      {request.accessReason}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  <AdminActionForm
                    action={approveAccessRequestAction}
                    className="min-w-0"
                    confirmation={{
                      confirmLabel: "Ya, setujui akses",
                      description: `${request.user.fullName} akan memperoleh akses sebagai ${getRoleLabel(request.requestedRole)} dan dapat masuk ke sistem setelah persyaratan akun terpenuhi.`,
                      eyebrow: "Persetujuan akses pengguna",
                      title: `Setujui pengajuan ${request.user.fullName}?`,
                      tone: "primary",
                    }}
                    csrfToken={csrfToken}
                    fields={{ accessRequestId: request.id }}
                    icon="check"
                    variant="primary"
                  >
                    Setujui
                  </AdminActionForm>
                  <AdminActionForm
                    action={rejectAccessRequestAction}
                    className="min-w-0"
                    confirmation={{
                      confirmLabel: "Ya, tolak pengajuan",
                      description: `Pengajuan akses ${request.user.fullName} akan ditolak dan tidak dapat diproses sebagai pengajuan aktif.`,
                      eyebrow: "Tolak akses pengguna",
                      title: `Tolak pengajuan ${request.user.fullName}?`,
                      tone: "danger",
                    }}
                    csrfToken={csrfToken}
                    fields={{ accessRequestId: request.id }}
                    icon="x"
                    variant="dangerOutline"
                  >
                    Tolak
                  </AdminActionForm>
                  {!request.user.emailVerifiedAt ? (
                    <AdminActionForm
                      action={resendUserVerificationEmailAction}
                      className="col-span-2 min-w-0 sm:col-span-1"
                      confirmation={{
                        confirmLabel: "Ya, kirim email",
                        description: `Sistem akan mengirim tautan verifikasi baru ke ${request.user.email}.`,
                        eyebrow: "Kirim email verifikasi",
                        title: `Kirim verifikasi untuk ${request.user.fullName}?`,
                        tone: "primary",
                      }}
                      csrfToken={csrfToken}
                      fields={{ targetUserId: request.user.id }}
                      icon="send"
                      variant="neutralOutline"
                    >
                      Verifikasi
                    </AdminActionForm>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
