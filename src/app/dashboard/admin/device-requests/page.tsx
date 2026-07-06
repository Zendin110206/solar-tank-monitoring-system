import Link from "next/link";
import type { Metadata } from "next";
import { Clock3, Database, Search, ShieldCheck } from "lucide-react";

import { createAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import { getDeviceRequestStatusLabel } from "@/features/monitoring/lib/device-request";
import {
  listDeviceRequestsForAdminFromMysql,
  listHardwareProfilesFromMysql,
} from "@/features/monitoring/lib/mysql-device-request-repository";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import type {
  DeviceRequestStatus,
  MonitoringDeviceRequest,
} from "@/features/monitoring/types/monitoring";
import { AdminDeviceRequestsPanel } from "./admin-device-requests-panel";

const DEVICE_REQUEST_STATUS_OPTIONS: Array<{
  label: string;
  value: DeviceRequestStatus | "all";
}> = [
  { label: "Semua status", value: "all" },
  { label: "Menunggu review", value: "pending_admin_review" },
  { label: "Disetujui", value: "approved_package_ready" },
  { label: "Menunggu perangkat", value: "waiting_first_valid_ping" },
  { label: "Aktif", value: "active" },
  { label: "Ditolak", value: "rejected" },
  { label: "Dicabut", value: "revoked" },
  { label: "Kedaluwarsa", value: "expired" },
];

type AdminDeviceRequestsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Tinjau Pengajuan Perangkat | SolarTank",
  description:
    "Tinjauan admin untuk pengajuan perangkat baru sebelum paket firmware SolarTank dibuat.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeFilterValue(value: string) {
  return value.toLocaleLowerCase("id-ID").trim();
}

function getRequestedStatus(value: string | undefined) {
  const cleanValue = String(value ?? "all").trim();
  const matchedOption = DEVICE_REQUEST_STATUS_OPTIONS.find(
    (option) => option.value === cleanValue,
  );

  return matchedOption?.value ?? "all";
}

function filterDeviceRequests({
  query,
  requests,
  status,
}: {
  query: string;
  requests: MonitoringDeviceRequest[];
  status: DeviceRequestStatus | "all";
}) {
  const cleanQuery = normalizeFilterValue(query);

  return requests.filter((request) => {
    if (status !== "all" && request.status !== status) {
      return false;
    }

    if (!cleanQuery) {
      return true;
    }

    const haystack = [
      request.requestCode,
      request.siteCode,
      request.siteName,
      request.areaLabel,
      request.deviceCode,
      request.deviceLabel,
      request.requesterEmail,
      request.requesterUserId,
      getDeviceRequestStatusLabel(request.status),
    ]
      .map(normalizeFilterValue)
      .join(" ");

    return haystack.includes(cleanQuery);
  });
}

export default async function AdminDeviceRequestsPage({
  searchParams,
}: AdminDeviceRequestsPageProps) {
  const admin = await requirePageAdmin();
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const statusFilter = getRequestedStatus(params.status);
  const csrfToken = createAdminActionCsrfToken(admin.sessionId);
  const isMysqlEnabled = getMonitoringStorageDriver() === "mysql";
  const [requests, hardwareProfiles] = isMysqlEnabled
    ? await Promise.all([
        listDeviceRequestsForAdminFromMysql(),
        listHardwareProfilesFromMysql(),
      ])
    : [[], []];
  const pendingCount = requests.filter(
    (request) => request.status === "pending_admin_review",
  ).length;
  const filteredRequests = filterDeviceRequests({
    query,
    requests,
    status: statusFilter,
  });

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f5faf8] text-zinc-950">
      <header className="shrink-0 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1540px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-3"
            aria-label="Kembali ke dashboard SolarTank"
          >
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </Link>
          <nav className="flex w-full min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-sm font-semibold text-zinc-600 lg:w-auto">
            <Link
              href="/dashboard"
              className="shrink-0 rounded-lg px-3 py-2 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Monitoring Tangki
            </Link>
            <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-white">
              Tinjau Pengajuan
            </span>
            <Link
              href="/dashboard/admin/users"
              className="shrink-0 rounded-lg px-3 py-2 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Manajemen Pengguna
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1540px] flex-1 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Summary section */}
        <section className="shrink-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-600">
                Tinjauan perangkat baru
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Pengajuan perangkat sebelum paket firmware dibuat
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
                Admin cukup melihat daftar ringkas terlebih dahulu. Detail teknis,
                validasi, dan aksi keputusan dibuka dari tombol tinjau agar halaman
                tetap bersih.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Clock3,
                  label: "Pending",
                  value: pendingCount,
                },
                {
                  icon: Database,
                  label: "Total",
                  value: requests.length,
                },
                {
                  icon: ShieldCheck,
                  label: "Admin",
                  value: admin.fullName,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                    key={item.label}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-zinc-200">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-zinc-950">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {!isMysqlEnabled ? (
          <section className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Tinjauan pengajuan perangkat memerlukan storage MySQL. Aktifkan
            database MySQL dan jalankan migrasi provisioning perangkat terlebih
            dahulu.
          </section>
        ) : null}

        {/* Filter section */}
        <section className="shrink-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_16rem_auto_auto] lg:items-end">
            <form
              action="/dashboard/admin/device-requests"
              className="contents"
            >
              <label className="grid gap-1.5 text-sm font-semibold text-zinc-950">
                Cari pengajuan
                <span className="relative block">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    defaultValue={query}
                    name="q"
                    placeholder="Cari STO, device, email, atau kode"
                    type="search"
                  />
                </span>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-zinc-950">
                Status
                <select
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none transition hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  defaultValue={statusFilter}
                  name="status"
                >
                  {DEVICE_REQUEST_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
                type="submit"
              >
                Terapkan
              </button>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15"
                href="/dashboard/admin/device-requests"
              >
                Reset
              </Link>
            </form>
          </div>
        </section>

        <AdminDeviceRequestsPanel
          csrfToken={csrfToken}
          filteredRequests={filteredRequests}
          hardwareProfiles={hardwareProfiles}
          isMysqlEnabled={isMysqlEnabled}
          totalRequestCount={requests.length}
        />
      </div>
    </main>
  );
}
