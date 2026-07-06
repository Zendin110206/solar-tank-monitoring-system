import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Clock3,
  Cpu,
  Database,
  Search,
  ShieldCheck,
} from "lucide-react";

import { createAdminActionCsrfToken } from "@/features/auth/lib/auth-csrf";
import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import {
  getDeviceRequestStatusLabel,
  getDeviceSensorTypeLabel,
} from "@/features/monitoring/lib/device-request";
import {
  listDeviceRequestsForAdminFromMysql,
  listHardwareProfilesFromMysql,
} from "@/features/monitoring/lib/mysql-device-request-repository";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import type {
  DeviceRequestStatus,
  MonitoringDeviceRequest,
  MonitoringHardwareProfile,
} from "@/features/monitoring/types/monitoring";
import {
  ApproveDeviceRequestForm,
  CleanupDeviceRequestForm,
  CleanupSelectedDeviceRequestsForm,
  ReissueDevicePackageForm,
  RejectDeviceRequestForm,
  ResendDevicePackageForm,
  ResetMonitoringDeviceDataForm,
  RevokeDeviceProvisioningForm,
} from "./admin-device-request-controls";

const BULK_CLEANUP_FORM_ID = "device-request-bulk-cleanup-form";

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

function formatDate(value: string | null | undefined) {
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
      getDeviceRequestStatusLabel(request.status),
    ]
      .map(normalizeFilterValue)
      .join(" ");

    return haystack.includes(cleanQuery);
  });
}

function getStatusClass(status: DeviceRequestStatus) {
  switch (status) {
    case "pending_admin_review":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-100";
    case "approved_waiting_package":
    case "approved_package_ready":
    case "waiting_firmware_download":
    case "waiting_first_valid_ping":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "expired":
    case "revoked":
    case "package_generation_failed":
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
}

function getProfileLabel(
  request: MonitoringDeviceRequest,
  profileById: Map<string, MonitoringHardwareProfile>,
) {
  const profile = profileById.get(request.hardwareProfileId);

  if (!profile) {
    return "Profil hardware tidak ditemukan";
  }

  return `${profile.name} (${profile.triggerPin}/${profile.echoPin})`;
}

function getDimensionSummary(request: MonitoringDeviceRequest) {
  if (request.tankShape === "rectangular") {
    return `${request.lengthCm ?? "-"} x ${request.widthCm ?? "-"} x ${
      request.heightCm ?? "-"
    } cm`;
  }

  return `Panjang ${request.lengthCm ?? "-"} cm, diameter ${
    request.diameterCm ?? "-"
  } cm`;
}

function RequestCard({
  bulkCleanupFormId,
  csrfToken,
  profileById,
  request,
}: {
  bulkCleanupFormId: string;
  csrfToken: string;
  profileById: Map<string, MonitoringHardwareProfile>;
  request: MonitoringDeviceRequest;
}) {
  const canReview = request.status === "pending_admin_review";
  const canResend =
    request.status === "approved_package_ready" ||
    request.status === "waiting_firmware_download" ||
    request.status === "waiting_first_valid_ping";
  const canReissue =
    request.status === "approved_package_ready" ||
    request.status === "waiting_firmware_download" ||
    request.status === "waiting_first_valid_ping" ||
    request.status === "expired" ||
    request.status === "package_generation_failed";
  const canRevoke =
    request.status !== "pending_admin_review" &&
    request.status !== "rejected" &&
    request.status !== "revoked";

  return (
    <article className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm xl:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-100">
            <input
              className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600/20"
              form={bulkCleanupFormId}
              name="requestIds"
              type="checkbox"
              value={request.id}
            />
            Pilih hapus
          </label>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
            {request.requestCode}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
              request.status,
            )}`}
          >
            {getDeviceRequestStatusLabel(request.status)}
          </span>
          {request.validationWarnings.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              <AlertTriangle className="size-3" aria-hidden="true" />
              perlu cek dimensi
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold text-zinc-950">
          {request.siteName}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Pengaju: {request.requesterEmail}
        </p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              STO
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.siteCode} / {request.areaLabel}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Tangki
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.tankShape === "rectangular"
                ? "Balok"
                : "Silinder horizontal"}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Kapasitas
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.capacityLiter} L
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Dimensi
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {getDimensionSummary(request)}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Mode sensor
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {getDeviceSensorTypeLabel(request.deviceSensorType)}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Koordinat
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.latitude ?? "-"}, {request.longitude ?? "-"}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Beban lokasi
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.loadValue} {request.loadUnit.toUpperCase()}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Diesel engine
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.dieselEngineCapacityKva} kVA
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Cos phi
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.cosPhi}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <dt className="text-xs font-semibold uppercase text-zinc-500">
              Konsumsi hitung
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {request.consumptionLiterPerHour} L/jam
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-lg bg-white p-3 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200">
          <span className="font-semibold text-zinc-950">Profil hardware:</span>{" "}
          {getProfileLabel(request, profileById)}
        </div>

        {request.validationWarnings.length > 0 ? (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
            {request.validationWarnings.map((warning) => (
              <p key={`${warning.field}-${warning.message}`}>{warning.message}</p>
            ))}
          </div>
        ) : null}

        {request.rejectionReason ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700 ring-1 ring-red-100">
            {request.rejectionReason}
          </div>
        ) : null}
      </div>

      <aside className="grid content-start gap-3">
        <div className="rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200">
          <p>Diajukan: {formatDate(request.createdAt)}</p>
          <p>Ditinjau: {formatDate(request.adminReviewedAt)}</p>
        </div>

        {canReview ? (
          <>
            <ApproveDeviceRequestForm
              csrfToken={csrfToken}
              requestId={request.id}
            />
            <RejectDeviceRequestForm
              csrfToken={csrfToken}
              requestId={request.id}
            />
          </>
        ) : canResend || canReissue || canRevoke ? (
          <div className="grid gap-2 rounded-lg bg-white p-4 ring-1 ring-zinc-200">
            <p className="text-sm font-semibold text-zinc-950">
              Aksi operasional
            </p>
            <p className="text-xs leading-5 text-zinc-500">
              Gunakan hanya jika link email bermasalah, paket perlu dibuat
              ulang, atau akses perangkat perlu dicabut.
            </p>
            {canResend ? (
              <ResendDevicePackageForm
                csrfToken={csrfToken}
                requestId={request.id}
              />
            ) : null}
            {canReissue ? (
              <ReissueDevicePackageForm
                csrfToken={csrfToken}
                requestId={request.id}
              />
            ) : null}
            {canRevoke ? (
              <RevokeDeviceProvisioningForm
                csrfToken={csrfToken}
                requestId={request.id}
              />
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-500 ring-1 ring-zinc-200">
            Pengajuan ini sudah diproses dan tidak bisa ditinjau ulang dari
            halaman ini.
          </div>
        )}

        <div className="border-t border-zinc-100 pt-3">
          <CleanupDeviceRequestForm
            csrfToken={csrfToken}
            requestId={request.id}
            requestLabel={request.requestCode}
          />
        </div>
      </aside>
    </article>
  );
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
  const profileById = new Map(
    hardwareProfiles.map((profile) => [profile.id, profile]),
  );
  const pendingCount = requests.filter(
    (request) => request.status === "pending_admin_review",
  ).length;
  const filteredRequests = filterDeviceRequests({
    query,
    requests,
    status: statusFilter,
  });

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
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

      <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr] xl:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Tinjauan perangkat baru
              </p>
              <h1 className="mt-2 max-w-4xl text-2xl font-semibold sm:text-4xl">
                Pengajuan perangkat sebelum paket firmware dibuat
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                Admin memeriksa data STO, dimensi tangki, profil hardware,
                beban lokasi, dan kode perangkat hasil sistem. Saat disetujui,
                sistem membuat key perangkat, paket firmware, dan link download;
                perangkat tetap belum aktif sampai ping valid pertama diterima.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Pending",
                  value: pendingCount,
                  icon: Clock3,
                },
                {
                  label: "Total",
                  value: requests.length,
                  icon: Database,
                },
                {
                  label: "Admin",
                  value: admin.fullName,
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <span className="grid size-10 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-zinc-200">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-xs font-semibold uppercase text-zinc-500">
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
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Tinjauan pengajuan perangkat memerlukan storage MySQL. Aktifkan
            database MySQL dan jalankan migrasi provisioning perangkat terlebih
            dahulu.
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Daftar pengajuan
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Perangkat yang perlu diputuskan
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
              <Cpu className="size-4" aria-hidden="true" />
              {hardwareProfiles.length} profil hardware
            </span>
          </div>

          <form
            action="/dashboard/admin/device-requests"
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_16rem_auto_auto] lg:items-end"
          >
            <label className="grid gap-2 text-sm font-semibold text-zinc-950">
              Cari pengajuan
              <span className="relative block">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                />
                <input
                  className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  defaultValue={query}
                  name="q"
                  placeholder="Cari STO, device, email, atau kode"
                  type="search"
                />
              </span>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-950">
              Status
              <select
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none transition hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
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
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
              type="submit"
            >
              Terapkan
            </button>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15"
              href="/dashboard/admin/device-requests"
            >
              Reset
            </Link>
          </form>

          {isMysqlEnabled ? (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
              <CleanupSelectedDeviceRequestsForm
                csrfToken={csrfToken}
                formId={BULK_CLEANUP_FORM_ID}
              />
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm leading-6 text-zinc-500">
                Belum ada pengajuan perangkat.
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm leading-6 text-zinc-500">
                Tidak ada pengajuan yang cocok dengan filter ini.
              </div>
            ) : (
              filteredRequests.map((request) => (
                <RequestCard
                  bulkCleanupFormId={BULK_CLEANUP_FORM_ID}
                  csrfToken={csrfToken}
                  key={request.id}
                  profileById={profileById}
                  request={request}
                />
              ))
            )}
          </div>

          {isMysqlEnabled ? (
            <details className="mt-5 rounded-lg border border-red-100 bg-red-50/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-red-800">
                Opsi lanjutan: reset semua data monitoring
              </summary>
              <div className="mt-3 max-w-3xl text-sm leading-6 text-red-700">
                Gunakan hanya ketika tim benar-benar ingin mulai ulang dari data
                monitoring kosong. Akun pengguna, akun admin, template firmware,
                dan profil hardware tetap disimpan.
              </div>
              <div className="mt-4 max-w-xl">
                <ResetMonitoringDeviceDataForm csrfToken={csrfToken} />
              </div>
            </details>
          ) : null}
        </section>
      </div>
    </main>
  );
}
