import type { Metadata } from "next";
import { Clock3, Cpu, FileCheck2, ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requirePageUser } from "@/features/auth/lib/auth-guards";
import {
  getDeviceRequestStatusLabel,
  getDeviceSensorTypeLabel,
} from "@/features/monitoring/lib/device-request";
import {
  listDeviceRequestsForUserFromMysql,
  listHardwareProfilesFromMysql,
} from "@/features/monitoring/lib/mysql-device-request-repository";
import { getMonitoringStorageDriver } from "@/features/monitoring/lib/monitoring-storage";
import type {
  DeviceRequestStatus,
  MonitoringDeviceRequest,
} from "@/features/monitoring/types/monitoring";
import { DeviceRequestForm } from "./device-request-form";

export const metadata: Metadata = {
  title: "Ajukan Perangkat | SolarTank",
  description:
    "Pengajuan perangkat monitoring baru untuk proses tinjauan admin dan persiapan paket firmware SolarTank.",
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

function getTankShapeLabel(request: MonitoringDeviceRequest) {
  return request.tankShape === "rectangular"
    ? "Tangki balok"
    : "Tangki silinder horizontal";
}

function RequestHistory({
  requests,
}: {
  requests: MonitoringDeviceRequest[];
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">
            Riwayat pengajuan
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Status perangkat yang pernah diajukan
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          <Clock3 className="size-4" aria-hidden="true" />
          {requests.length} pengajuan
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {requests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm leading-6 text-zinc-500">
            Belum ada pengajuan perangkat dari akun ini.
          </div>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 lg:grid-cols-[1fr_auto]"
            >
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
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-950">
                  {request.siteName}
                </h3>
                <div className="mt-2 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                  <p>Wilayah: {request.areaLabel}</p>
                  <p>Perangkat: {request.deviceCode}</p>
                  <p>{getTankShapeLabel(request)}</p>
                  <p>{getDeviceSensorTypeLabel(request.deviceSensorType)}</p>
                  <p>Kapasitas: {request.capacityLiter} L</p>
                  <p>Konsumsi: {request.consumptionLiterPerHour} L/jam</p>
                </div>
                {request.rejectionReason ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 ring-1 ring-red-100">
                    {request.rejectionReason}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1 text-sm text-zinc-500 lg:text-right">
                <p>Diajukan: {formatDate(request.createdAt)}</p>
                <p>Ditinjau: {formatDate(request.adminReviewedAt)}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default async function DeviceRequestPage() {
  const user = await requirePageUser();
  const isMysqlEnabled = getMonitoringStorageDriver() === "mysql";
  const [hardwareProfiles, requests] = isMysqlEnabled
    ? await Promise.all([
        listHardwareProfilesFromMysql({ activeOnly: true }),
        listDeviceRequestsForUserFromMysql(user.id),
      ])
    : [[], []];

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[
          { href: "/dashboard", label: "Monitoring Tangki" },
          ...(user.role === "admin"
            ? [
                {
                  href: "/dashboard/admin/device-requests",
                  label: "Tinjau Pengajuan",
                },
              ]
            : []),
        ]}
        user={user}
      />

      <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr] xl:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Pengajuan perangkat
              </p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold sm:text-4xl">
                Siapkan perangkat baru untuk ditinjau admin
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                Isi data STO, tangki, mode sensor, dan beban genset. Setelah
                admin menyetujui, sistem membuat kode device, device key, paket
                firmware, dan link download ke email kerja akun ini.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Data STO",
                  body: "Nama, wilayah, koordinat, dan kode otomatis.",
                  icon: FileCheck2,
                },
                {
                  label: "Profil perangkat",
                  body: "Mode sensor, board, pin trigger, dan pin echo.",
                  icon: Cpu,
                },
                {
                  label: "Tinjauan admin",
                  body: "Perangkat belum aktif sebelum disetujui.",
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
                    <p className="mt-3 text-sm font-semibold text-zinc-950">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {!isMysqlEnabled ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Fitur pengajuan perangkat memerlukan storage MySQL. Aktifkan
            <span className="font-semibold"> SOLAR_TANK_STORAGE_DRIVER=mysql </span>
            dan jalankan migrasi provisioning perangkat sebelum dipakai.
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase text-zinc-500">
              Form pengajuan
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Data perangkat dan tangki
            </h2>
          </div>
          <DeviceRequestForm hardwareProfiles={hardwareProfiles} />
        </section>

        <RequestHistory requests={requests} />
      </div>
    </main>
  );
}
