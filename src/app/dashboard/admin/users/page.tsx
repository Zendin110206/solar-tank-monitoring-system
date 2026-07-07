import type { Metadata } from "next";
import { Clock3, ShieldCheck, UserRound } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { AuthUserStatus } from "@/features/auth/types";
import { createAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import {
  listAuthUsers,
  listPendingAccessRequests,
} from "@/features/auth/lib/mysql-auth-repository";
import {
  activateAuthUserAction,
  approveAccessRequestAction,
  changeAuthUserRoleAction,
  disableAuthUserAction,
  rejectAccessRequestAction,
  resendUserVerificationEmailAction,
  revokeAuthUserSessionsAction,
  sendUserPasswordResetAction,
} from "./actions";
import { AdminActionForm, AdminRoleForm } from "./admin-action-controls";

export const metadata: Metadata = {
  title: "Manajemen Pengguna | SolarTank",
  description:
    "Manajemen akses pengguna SolarTank untuk admin monitoring tangki solar.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getStatusLabel(status: AuthUserStatus) {
  switch (status) {
    case "active":
      return "Aktif";
    case "disabled":
      return "Nonaktif";
    case "suspended":
      return "Ditahan";
    case "pending":
      return "Pending";
  }
}

function getStatusClass(status: AuthUserStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "disabled":
      return "bg-red-50 text-red-700 ring-red-100";
    case "suspended":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "pending":
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
}

export default async function AdminUsersPage() {
  const admin = await requirePageAdmin();
  const csrfToken = createAdminActionCsrfToken(admin.sessionId);
  const [accessRequests, users] = await Promise.all([
    listPendingAccessRequests(),
    listAuthUsers(),
  ]);

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[
          { href: "/dashboard", label: "Monitoring Tangki" },
          { current: true, label: "Manajemen Pengguna" },
          {
            href: "/dashboard/admin/device-requests",
            label: "Tinjau Pengajuan",
          },
          { href: "/dashboard/admin/audit", label: "Audit Keamanan" },
        ]}
        user={admin}
      />

      <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Akses pengguna
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Pengguna dan pengajuan akses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Halaman ini hanya untuk admin. Pengajuan baru ditahan sampai
                disetujui agar dashboard tidak terbuka untuk akun sembarang.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 ring-1 ring-blue-100">
              Masuk sebagai <span className="font-semibold">{admin.fullName}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Perlu review
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Pengajuan akses pending
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
              <Clock3 className="size-4" aria-hidden="true" />
              {accessRequests.length} pending
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {accessRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
                Belum ada pengajuan akses baru.
              </div>
            ) : (
              accessRequests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-zinc-200">
                        <UserRound className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-zinc-950">
                          {request.user.fullName}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {request.user.email} / {request.user.username}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                      <p>
                        Role diminta:{" "}
                        <span className="font-semibold text-zinc-950">
                          {request.requestedRole}
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
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200">
                        {request.accessReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <AdminActionForm
                      action={approveAccessRequestAction}
                      csrfToken={csrfToken}
                      fields={{ accessRequestId: request.id }}
                      icon="check"
                      variant="primary"
                    >
                      Setujui
                    </AdminActionForm>
                    <AdminActionForm
                      action={rejectAccessRequestAction}
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
                        csrfToken={csrfToken}
                        fields={{ targetUserId: request.user.id }}
                        icon="send"
                        variant="neutralOutline"
                      >
                        Kirim verifikasi
                      </AdminActionForm>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Akun terdaftar
              </p>
              <h2 className="mt-1 text-xl font-semibold">Daftar pengguna</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {users.length} akun
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1240px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Verifikasi</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Login terakhir</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.id === admin.id;
                  const canUseDirectActions = user.status !== "pending";
                  const canSaveRole = canUseDirectActions && !isCurrentUser;
                  const canDisable =
                    canUseDirectActions &&
                    !isCurrentUser &&
                    user.status === "active";
                  const canActivate =
                    canUseDirectActions &&
                    !isCurrentUser &&
                    user.status !== "active";
                  const canRevokeSessions =
                    canUseDirectActions && !isCurrentUser;

                  return (
                    <tr key={user.id} className="bg-zinc-50">
                      <td className="rounded-l-lg px-3 py-3 font-semibold text-zinc-950">
                        {user.fullName}
                        <span className="block text-xs font-normal text-zinc-500">
                          {user.username}
                        </span>
                        {isCurrentUser ? (
                          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                            akun Anda
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {user.email}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            user.emailVerifiedAt
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : "bg-amber-50 text-amber-700 ring-amber-100"
                          }`}
                        >
                          {user.emailVerifiedAt ? "Terverifikasi" : "Belum"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <AdminRoleForm
                          action={changeAuthUserRoleAction}
                          csrfToken={csrfToken}
                          currentRole={user.role}
                          disabled={!canSaveRole}
                          targetUserId={user.id}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClass(user.status)}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="rounded-r-lg px-3 py-3">
                        {user.status === "pending" ? (
                          <span className="text-sm font-medium text-zinc-500">
                            Proses lewat review
                          </span>
                        ) : isCurrentUser ? (
                          <span className="text-sm font-medium text-zinc-500">
                            Tidak bisa ubah akun sendiri
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {canDisable ? (
                              <AdminActionForm
                                action={disableAuthUserAction}
                                csrfToken={csrfToken}
                                fields={{ targetUserId: user.id }}
                                icon="ban"
                                variant="dangerOutline"
                              >
                                Nonaktifkan
                              </AdminActionForm>
                            ) : null}

                            {canActivate ? (
                              <AdminActionForm
                                action={activateAuthUserAction}
                                csrfToken={csrfToken}
                                fields={{ targetUserId: user.id }}
                                icon="refresh"
                                variant="success"
                              >
                                Aktifkan
                              </AdminActionForm>
                            ) : null}

                            {canRevokeSessions ? (
                              <AdminActionForm
                                action={revokeAuthUserSessionsAction}
                                csrfToken={csrfToken}
                                fields={{ targetUserId: user.id }}
                                icon="logout"
                                variant="neutralOutline"
                              >
                                Cabut sesi
                              </AdminActionForm>
                            ) : null}

                            {!user.emailVerifiedAt ? (
                              <AdminActionForm
                                action={resendUserVerificationEmailAction}
                                csrfToken={csrfToken}
                                fields={{ targetUserId: user.id }}
                                icon="send"
                                variant="neutralOutline"
                              >
                                Kirim verifikasi
                              </AdminActionForm>
                            ) : null}

                            {canUseDirectActions ? (
                              <AdminActionForm
                                action={sendUserPasswordResetAction}
                                csrfToken={csrfToken}
                                disabled={isCurrentUser}
                                fields={{ targetUserId: user.id }}
                                icon="key"
                                variant="neutralOutline"
                              >
                                Reset password
                              </AdminActionForm>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
