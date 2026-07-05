import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Clock3, Cpu, Database, ShieldCheck } from "lucide-react";

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
  ReissueDevicePackageForm,
  RejectDeviceRequestForm,
  ResendDevicePackageForm,
  RevokeDeviceProvisioningForm,
} from "./admin-device-request-controls";

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
  csrfToken,
  profileById,
  request,
}: {
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
    <article className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="rounded-lg bg-white p-4 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200">
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
          <div className="rounded-lg bg-white p-4 text-sm leading-6 text-zinc-500 ring-1 ring-zinc-200">
            Pengajuan ini sudah diproses dan tidak bisa ditinjau ulang dari
            halaman ini.
          </div>
        )}
      </aside>
    </article>
  );
}

export default async function AdminDeviceRequestsPage() {
  const admin = await requirePageAdmin();
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

          <div className="mt-5 grid gap-3">
            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm leading-6 text-zinc-500">
                Belum ada pengajuan perangkat.
              </div>
            ) : (
              requests.map((request) => (
                <RequestCard
                  csrfToken={csrfToken}
                  key={request.id}
                  profileById={profileById}
                  request={request}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
