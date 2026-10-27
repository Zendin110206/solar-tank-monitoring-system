import { changeAuthUserRoleAction } from "./actions";
import { AdminRoleForm } from "./admin-action-controls";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { createAdminActionCsrfToken } from "@/features/auth/server/auth-csrf";
import { requirePageAdmin } from "@/features/auth/server/auth-guards";
import {
  listAuthUsersForAdmin,
  listPendingAccessRequests,
} from "@/features/auth/server/user-admin-service";
import {
  Clock3,
  Filter,
  MailWarning,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { PendingAccessRequests } from "./_components/pending-access-requests";
import { UserActionStack } from "./_components/user-action-stack";
import {
  EmailVerificationBadge,
  StatusBadge,
  UserIdentity,
} from "./_components/user-badges";
import {
  SearchField,
  UserFilterControls,
} from "./_components/user-filter-controls";
import {
  formatDate,
  getPageNumbers,
  getPageSize,
  getParam,
  getPositiveInteger,
  getRoleFilter,
  getSortFilter,
  getStatusFilter,
  getUsersHref,
  getVerificationFilter,
  PAGE_SIZE_OPTIONS,
  type UsersUrlState,
} from "./_components/users-page-state";

export const metadata: Metadata = {
  title: "Manajemen Pengguna | FTM",
  description:
    "Manajemen akses pengguna FTM untuk admin manajemen tangki bahan bakar.",
};

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const FILTER_BUTTON_CLASS =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20";

const FILTER_RESET_CLASS =
  "inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15";

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
    role?: string | string[];
    sort?: string | string[];
    status?: string | string[];
    verification?: string | string[];
  }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const admin = await requirePageAdmin();
  const params = await searchParams;
  const query = getParam(params.q).trim();
  const statusFilter = getStatusFilter(getParam(params.status));
  const roleFilter = getRoleFilter(getParam(params.role));
  const verificationFilter = getVerificationFilter(
    getParam(params.verification),
  );
  const sortFilter = getSortFilter(getParam(params.sort));
  const pageSize = getPageSize(getParam(params.pageSize));
  const requestedPage = getPositiveInteger(getParam(params.page), 1);
  const csrfToken = createAdminActionCsrfToken(admin.sessionId);
  const [accessRequests, directory] = await Promise.all([
    listPendingAccessRequests(),
    listAuthUsersForAdmin({
      page: requestedPage,
      pageSize,
      query,
      role: roleFilter,
      sort: sortFilter,
      status: statusFilter,
      verification: verificationFilter,
    }),
  ]);
  const urlState: UsersUrlState = {
    page: directory.page,
    pageSize: directory.pageSize,
    query,
    role: roleFilter,
    sort: sortFilter,
    status: statusFilter,
    verification: verificationFilter,
  };
  const showingStart =
    directory.filteredCount === 0
      ? 0
      : (directory.page - 1) * directory.pageSize + 1;
  const showingEnd = Math.min(
    directory.filteredCount,
    directory.page * directory.pageSize,
  );
  const pageNumbers = getPageNumbers(directory.page, directory.pageCount);
  const activeFilterCount = [
    statusFilter !== "all",
    roleFilter !== "all",
    verificationFilter !== "all",
    sortFilter !== "created_desc",
    directory.pageSize !== PAGE_SIZE_OPTIONS[0],
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[
          { href: "/dashboard", label: "Manajemen Tangki" },
          { current: true, label: "Manajemen Pengguna" },
          {
            href: "/dashboard/admin/device-requests",
            label: "Tinjau Pengajuan",
          },
          { href: "/dashboard/admin/audit", label: "Audit Keamanan" },
        ]}
        user={admin}
      />

      <div className="mx-auto flex max-w-[1540px] flex-col gap-3 px-4 py-3 pb-20 sm:px-6 lg:px-8 lg:pb-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                User management
              </p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
                Pengguna dan akses admin
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              {[
                {
                  icon: UsersRound,
                  label: "Total",
                  value: directory.counts.total,
                },
                {
                  icon: UserCheck,
                  label: "Aktif",
                  value: directory.counts.active,
                },
                {
                  icon: Clock3,
                  label: "Pending",
                  value: directory.counts.pending,
                },
                {
                  icon: ShieldCheck,
                  label: "Admin",
                  value: directory.counts.admin,
                },
                {
                  icon: MailWarning,
                  label: "Email",
                  value: directory.counts.unverified,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3"
                    key={item.label}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-zinc-200">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-zinc-950">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PendingAccessRequests
          accessRequests={accessRequests}
          csrfToken={csrfToken}
        />

        <section className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
          <form
            action="/dashboard/admin/users"
            className="grid gap-2 xl:hidden"
            method="get"
          >
            <input name="page" type="hidden" value="1" />
            <SearchField query={query} />

            <details className="group rounded-lg border border-zinc-200 bg-zinc-50">
              <summary className="flex h-9 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <Filter className="size-4 text-blue-700" aria-hidden="true" />
                  Filter dan urutan
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} aktif`
                    : "Buka"}
                </span>
              </summary>
              <div className="grid gap-2 border-t border-zinc-200 p-2">
                <UserFilterControls
                  pageSize={directory.pageSize}
                  roleFilter={roleFilter}
                  sortFilter={sortFilter}
                  statusFilter={statusFilter}
                  verificationFilter={verificationFilter}
                />
              </div>
            </details>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button className={FILTER_BUTTON_CLASS} type="submit">
                <Filter className="size-4" aria-hidden="true" />
                Terapkan
              </button>
              <Link
                className={FILTER_RESET_CLASS}
                href="/dashboard/admin/users"
              >
                Reset
              </Link>
            </div>
          </form>

          <form
            action="/dashboard/admin/users"
            className="hidden gap-2 xl:grid xl:grid-cols-[minmax(16rem,1fr)_10rem_9rem_11rem_10rem_8rem_auto_auto] xl:items-center"
            method="get"
          >
            <input name="page" type="hidden" value="1" />
            <SearchField query={query} />
            <UserFilterControls
              pageSize={directory.pageSize}
              roleFilter={roleFilter}
              sortFilter={sortFilter}
              statusFilter={statusFilter}
              verificationFilter={verificationFilter}
            />
            <button className={FILTER_BUTTON_CLASS} type="submit">
              <Filter className="size-4" aria-hidden="true" />
              Terapkan
            </button>
            <Link className={FILTER_RESET_CLASS} href="/dashboard/admin/users">
              Reset
            </Link>
          </form>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                Daftar pengguna
              </p>
              <h2 className="mt-0.5 text-base font-semibold">
                {showingStart}-{showingEnd} dari {directory.filteredCount} akun
              </h2>
            </div>
            <span className="w-fit rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
              Halaman {directory.page} dari {directory.pageCount}
            </span>
          </div>

          {directory.users.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Tidak ada pengguna yang cocok.
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Ubah kata kunci atau reset filter untuk melihat semua akun.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    <tr>
                      <th className="w-[22%] px-4 py-2.5">User</th>
                      <th className="w-[22%] px-4 py-2.5">Email</th>
                      <th className="w-[13rem] px-4 py-2.5">Role</th>
                      <th className="w-[7rem] px-4 py-2.5">Status</th>
                      <th className="w-[9rem] px-4 py-2.5">Login</th>
                      <th className="w-[9rem] px-4 py-2.5">Dibuat</th>
                      <th className="w-[14rem] min-w-[14rem] px-4 py-2.5">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {directory.users.map((user) => {
                      const isCurrentUser = user.id === admin.id;
                      const canSaveRole =
                        user.status !== "pending" && !isCurrentUser;

                      return (
                        <tr
                          className="align-middle transition hover:bg-blue-50/40"
                          key={user.id}
                        >
                          <td className="px-4 py-2.5">
                            <UserIdentity
                              isCurrentUser={isCurrentUser}
                              user={user}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="max-w-56 truncate text-sm font-medium text-zinc-800">
                              {user.email}
                            </p>
                            <div className="mt-1">
                              <EmailVerificationBadge
                                verified={Boolean(user.emailVerifiedAt)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <AdminRoleForm
                              action={changeAuthUserRoleAction}
                              compact
                              csrfToken={csrfToken}
                              currentRole={user.role}
                              disabled={!canSaveRole}
                              targetUserId={user.id}
                              targetUserName={user.fullName}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600">
                            {formatDate(user.lastLoginAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="min-w-[14rem] whitespace-nowrap px-4 py-2.5">
                            <UserActionStack
                              adminId={admin.id}
                              csrfToken={csrfToken}
                              user={user}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 lg:hidden">
                {directory.users.map((user) => {
                  const isCurrentUser = user.id === admin.id;
                  const canSaveRole =
                    user.status !== "pending" && !isCurrentUser;

                  return (
                    <article
                      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                      key={user.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <UserIdentity
                          isCurrentUser={isCurrentUser}
                          user={user}
                        />
                        <StatusBadge status={user.status} />
                      </div>

                      <div className="mt-3 min-w-0">
                        <p className="break-all text-sm font-medium text-zinc-800">
                          {user.email}
                        </p>
                        <div className="mt-1.5">
                          <EmailVerificationBadge
                            verified={Boolean(user.emailVerifiedAt)}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-200 pt-3 text-xs text-zinc-600">
                        <div>
                          <p className="font-semibold uppercase tracking-[0.14em] text-zinc-400">
                            Login
                          </p>
                          <p className="mt-1 leading-5">
                            {formatDate(user.lastLoginAt)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.14em] text-zinc-400">
                            Dibuat
                          </p>
                          <p className="mt-1 leading-5">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-zinc-200 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                          Role
                        </p>
                        <div className="mt-2">
                          <AdminRoleForm
                            action={changeAuthUserRoleAction}
                            csrfToken={csrfToken}
                            currentRole={user.role}
                            disabled={!canSaveRole}
                            targetUserId={user.id}
                            targetUserName={user.fullName}
                          />
                        </div>
                      </div>

                      <div className="mt-3 border-t border-zinc-200 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                          Aksi
                        </p>
                        <div className="mt-2">
                          <UserActionStack
                            adminId={admin.id}
                            csrfToken={csrfToken}
                            user={user}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="grid gap-3 border-t border-zinc-200 px-4 pb-8 pt-3 text-center sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:pb-5 sm:text-left lg:pb-4">
            <p className="text-sm text-zinc-500 sm:justify-self-start">
              Menampilkan {showingStart}-{showingEnd} dari{" "}
              {directory.filteredCount} hasil.
            </p>
            <nav
              aria-label="Pagination pengguna"
              className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-self-center"
            >
              <Link
                aria-disabled={directory.page <= 1}
                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 ${
                  directory.page <= 1
                    ? "pointer-events-none border-zinc-100 bg-zinc-50 text-zinc-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
                href={getUsersHref(urlState, {
                  page: Math.max(1, directory.page - 1),
                })}
              >
                Previous
              </Link>

              {pageNumbers.map((pageNumber) => (
                <Link
                  aria-current={
                    pageNumber === directory.page ? "page" : undefined
                  }
                  className={`grid size-9 place-items-center rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 ${
                    pageNumber === directory.page
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                  href={getUsersHref(urlState, { page: pageNumber })}
                  key={pageNumber}
                >
                  {pageNumber}
                </Link>
              ))}

              <Link
                aria-disabled={directory.page >= directory.pageCount}
                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 ${
                  directory.page >= directory.pageCount
                    ? "pointer-events-none border-zinc-100 bg-zinc-50 text-zinc-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
                href={getUsersHref(urlState, {
                  page: Math.min(directory.pageCount, directory.page + 1),
                })}
              >
                Next
              </Link>
            </nav>
            <span aria-hidden="true" className="hidden sm:block" />
          </div>
        </section>
      </div>
    </main>
  );
}
