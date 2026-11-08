import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card } from "@/components/ui/card";
import { STATUS_BADGE_CLASS } from "@/components/ui/status-tone";
import { requirePageAdmin } from "@/features/auth/server/auth-guards";
import { LiveRefreshControl } from "@/features/monitoring/components/live-refresh-control";
import { getMonitoringRefreshIntervalMs } from "@/features/monitoring/components/refresh-interval";
import { SimpleTankVolumeChart } from "@/features/monitoring/components/simple-tank-volume-chart";
import { mergeMonitoringReadingsById } from "@/features/monitoring/domain/latest-reading";
import { buildSimpleTankDetail } from "@/features/monitoring/domain/simple-tank-detail-model";
import { buildTankDetail } from "@/features/monitoring/domain/tank-detail-view-model";
import { getMonitoringReferenceData } from "@/features/monitoring/server/monitoring-registry";
import { SectionHeader } from "@/components/ui/section-header";
import {
  listLatestMonitoringReadingsByTankWithSource,
  listMonitoringReadingsForTank,
} from "@/features/monitoring/server/monitoring-storage";
import { type ReadingValueSource } from "@/features/monitoring/types/monitoring";
import { formatNumber, formatRuntimeHour } from "@/lib/format";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Battery,
  Clock,
  Database,
  Fuel,
  History,
  Radio,
  Wifi,
  Zap,
} from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ReadingTable } from "./_components/reading-table";
import {
  type ParameterItem,
  type TimelineItem,
  toTankDetail,
} from "./_components/tank-detail-data";
import {
  formatConfigStatusLabel,
  formatMeasurement,
  statusMeta,
} from "./_components/tank-detail-format";
import { MetricCard, StatusBadge } from "./_components/tank-detail-ui";
import {
  ConfigReviewPanel,
  LocationPanel,
  ParameterList,
  RuntimeParameterPanel,
  TankConfigurationPanel,
} from "./_components/tank-panels";
import { TankVisual } from "./_components/tank-visual";

export const metadata: Metadata = {
  title: "Detail Tangki Bahan Bakar | FTM",
  description:
    "Halaman detail untuk membaca kondisi satu tangki bahan bakar, visual isi tangki, parameter perangkat, dan riwayat pembacaan.",
};

export const runtime = "nodejs";

function formatSourceLabel(source: ReadingValueSource) {
  const labels: Record<ReadingValueSource, string> = {
    device: "perangkat",
    backend: "backend",
    server: "server",
    unknown: "belum diketahui",
  };

  return labels[source];
}

export default async function TankDetailPage({
  params,
}: {
  params: Promise<{ tankId: string }>;
}) {
  const { tankId } = await params;

  await connection();
  const admin = await requirePageAdmin();

  const now = new Date();
  const [latestReadingsResult, tankHistoryReadings, referenceData] =
    await Promise.all([
      listLatestMonitoringReadingsByTankWithSource(),
      listMonitoringReadingsForTank(tankId),
      getMonitoringReferenceData(),
    ]);
  const tankView = buildTankDetail(tankId, {
    now,
    sites: referenceData.sites,
    tanks: referenceData.tanks,
    devices: referenceData.devices,
    readings: mergeMonitoringReadingsById(
      latestReadingsResult.readings,
      tankHistoryReadings,
    ),
  });

  if (!tankView) {
    notFound();
  }

  const simpleTankDetail = buildSimpleTankDetail(tankView, tankHistoryReadings);
  const tank = toTankDetail(tankView, simpleTankDetail.chartTrends);
  const refreshIntervalMs = getMonitoringRefreshIntervalMs();

  const status = statusMeta[tank.status];
  const metrics = [
    {
      label: "Volume saat ini",
      value: tank.hasReading ? `${formatNumber(tank.volumeLiter)} L` : "-",
      note: tank.hasReading
        ? `${tank.fillPercent}% dari kapasitas konfigurasi ${formatNumber(tank.capacityLiter)} L, sumber volume ${formatSourceLabel(tank.dataSources.volumeSource)}`
        : `menunggu pembacaan pertama dari perangkat, kapasitas konfigurasi ${formatNumber(tank.capacityLiter)} L`,
      icon: Fuel,
      tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    },
    {
      label: "Estimasi runtime",
      value: tank.hasReading ? formatRuntimeHour(tank.runtimeHour) : "-",
      note: tank.hasReading
        ? `berdasarkan konsumsi ${tank.consumptionLiterPerHour} L/jam, dihitung ${formatSourceLabel(tank.dataSources.runtimeSource)}`
        : `akan dihitung setelah volume terbaca, konsumsi konfigurasi ${tank.consumptionLiterPerHour} L/jam`,
      icon: Clock,
      tone: STATUS_BADGE_CLASS.success,
    },
    {
      label: "Status perangkat",
      value: status.label,
      note: `update terakhir ${tank.lastUpdateLabel}`,
      icon: Wifi,
      tone: `${status.soft} ${status.text} ${status.ring}`,
    },
    {
      label: "Sinyal RSSI",
      value: formatMeasurement(tank.rssiDbm, "dBm"),
      note: "nilai dari data perangkat jika tersedia",
      icon: Radio,
      tone: STATUS_BADGE_CLASS.neutral,
    },
  ];
  const deviceParameters: ParameterItem[] = [
    {
      label: "ID perangkat",
      value: tank.deviceId,
      note: "identitas perangkat untuk header X-Device-Id nanti",
      icon: Database,
    },
    {
      label: "Interval kirim",
      value: `${tank.expectedIntervalMin} menit`,
      note: "angka ini menjadi dasar status stale/offline",
      icon: Activity,
    },
    {
      label: "Tegangan",
      value: formatMeasurement(tank.batteryVolt, "V"),
      note: "nilai dari data perangkat jika tersedia",
      icon: Battery,
    },
    {
      label: "Waktu terima",
      value: tank.receivedAtLabel,
      note: "waktu server menerima data terakhir",
      icon: History,
    },
  ];
  const dataFlow: TimelineItem[] = [
    {
      label: "Tinggi ruang kosong terbaca",
      value: tank.hasReading ? `${tank.sensorDistanceCm} cm` : "-",
      detail: tank.hasReading
        ? "jarak kosong dari titik sensor ke permukaan bahan bakar"
        : "belum ada tinggi ruang kosong yang diterima",
    },
    {
      label: "Tinggi bahan bakar dihitung",
      value: tank.hasReading ? `${tank.fuelHeightCm} cm` : "-",
      detail: tank.hasReading
        ? `sumber tinggi bahan bakar ${formatSourceLabel(tank.dataSources.fuelHeightSource)}`
        : "tinggi bahan bakar belum dihitung sebelum data masuk",
    },
    {
      label: "Volume dan persen",
      value: tank.hasReading
        ? `${formatNumber(tank.volumeLiter)} L / ${tank.fillPercent}%`
        : "-",
      detail: tank.hasReading
        ? `volume dari ${formatSourceLabel(tank.dataSources.volumeSource)}, persen dari ${formatSourceLabel(tank.dataSources.fillPercentSource)}`
        : "dashboard tetap menampilkan STO sambil menunggu data pertama",
    },
    {
      label: "Runtime operasional",
      value: tank.hasReading ? `${tank.runtimeHour} jam` : "-",
      detail: tank.hasReading
        ? "perkiraan durasi genset dari konsumsi per jam"
        : "runtime baru valid setelah volume bahan bakar tersedia",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[
          { href: "/dashboard", label: "Manajemen Tangki" },
          { current: true, label: "Detail Tangki" },
          { href: "#riwayat", label: "Riwayat" },
          { href: "#lokasi", label: "Lokasi" },
          { href: "#konfigurasi", label: "Konfigurasi" },
          { href: "#data-perangkat", label: "Data perangkat" },
        ]}
        rightSlot={
          <>
            <LiveRefreshControl
              intervalMs={refreshIntervalMs}
              lastSyncedLabel={`Update ${tank.lastUpdateLabel}`}
              className="hidden md:inline-flex"
            />
            <div className="hidden sm:block">
              <StatusBadge status={tank.status} />
            </div>
          </>
        }
        user={admin}
      />

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Detail Toolbar */}
        <section className="animate-soft-fade mb-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-200"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Kembali ke dashboard
                </Link>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                  detail tangki
                </span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
                  data operasional
                </span>
              </div>

              <h1 className="mt-3 max-w-4xl break-words text-[1.85rem] font-semibold leading-[1.08] tracking-normal text-zinc-950 sm:text-4xl lg:text-5xl">
                {tank.tankName} {tank.siteName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                Detail ini menampilkan isi tangki, parameter sensor, estimasi
                runtime, riwayat pembacaan, dan posisi STO berbasis koordinat
                manual.
              </p>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5 xl:w-[48rem]">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Site
                </p>
                <p className="mt-1 text-lg font-semibold">{tank.siteCode}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Regional
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {tank.regionalLabel ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Wilayah
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {tank.wilayahLabel ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Area
                </p>
                <p className="mt-1 text-lg font-semibold">{tank.areaLabel}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Update
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {tank.lastUpdateLabel}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detail Metrics */}
        <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <ConfigReviewPanel tank={tank} />

        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.32fr_0.68fr]">
          <div className="min-w-0 space-y-5">
            {/* Tank Visual Section */}
            <section id="visual">
              <TankVisual tank={tank} />
            </section>

            {/* History Section */}
            <Card id="riwayat" className="animate-soft-fade min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader
                  limitDescriptionWidth
                  label="Riwayat"
                  title="Tren pembacaan"
                  description="Pilih rentang grafik, lalu unduh CSV dengan periode data yang sama."
                />
              </div>
              <SimpleTankVolumeChart
                capacityLiter={tank.capacityLiter}
                exportHrefBase={`/api/tanks/${tank.id}/readings/export`}
                trends={tank.chartTrends}
              />
              <ReadingTable tank={tank} />
            </Card>
          </div>

          <aside className="min-w-0 space-y-5">
            {/* Device Health Section */}
            <Card className="animate-soft-fade">
              <div className="flex items-start justify-between gap-4">
                <SectionHeader
                  limitDescriptionWidth
                  label="Perangkat"
                  title="Status sensor"
                  description="Informasi ini disiapkan untuk health check perangkat saat data real mulai masuk."
                />
                <StatusBadge status={tank.status} />
              </div>
              <ParameterList items={deviceParameters} />
            </Card>

            {/* Runtime Parameter Section */}
            <RuntimeParameterPanel tank={tank} />

            {/* Tank Configuration Section */}
            <TankConfigurationPanel tank={tank} />
          </aside>
        </div>

        {/* Location Section */}
        <section id="lokasi" className="mt-5 min-w-0">
          <LocationPanel tank={tank} />
        </section>

        <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-3">
          {/* Data Flow Section */}
          <Card className="animate-soft-fade">
            <SectionHeader
              limitDescriptionWidth
              label="Alur baca"
              title="Dari sensor ke keputusan"
              description="Urutan ini menjaga dashboard tidak salah memahami data mentah perangkat."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {dataFlow.map((item, index) => (
                <div key={item.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid size-9 place-items-center rounded-full bg-red-50 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                      {index + 1}
                    </span>
                    {index < dataFlow.length - 1 ? (
                      <span className="mt-2 h-full min-h-10 border-l border-zinc-200 sm:hidden xl:block" />
                    ) : null}
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold text-zinc-950">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Device Data Section */}
          <Card id="data-perangkat" className="animate-soft-fade">
            <SectionHeader
              limitDescriptionWidth
              label="Data perangkat"
              title="Field kompatibel CAT"
              description="Nilai berikut menjadi jembatan dari format perangkat lama ke data internal yang lebih rapi."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                [
                  "distance",
                  tank.hasReading ? `${tank.rawPayload.distance} cm` : "-",
                ],
                [
                  "raw.H_cm",
                  tank.hasReading ? `${tank.rawPayload.H_cm} cm` : "-",
                ],
                [
                  "raw.volume",
                  tank.hasReading
                    ? `${formatNumber(tank.rawPayload.volume)} L`
                    : "-",
                ],
                [
                  "raw.percent",
                  tank.hasReading ? `${tank.rawPayload.percent}%` : "-",
                ],
                [
                  "raw.wifi_rssi",
                  tank.hasReading
                    ? formatMeasurement(tank.rawPayload.wifi_rssi, "dBm")
                    : "-",
                ],
                [
                  "config.status",
                  formatConfigStatusLabel(tank.configReview.status),
                ],
                [
                  "source.volume",
                  formatSourceLabel(tank.dataSources.volumeSource),
                ],
                [
                  "source.percent",
                  formatSourceLabel(tank.dataSources.fillPercentSource),
                ],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <code className="text-sm font-semibold text-zinc-700">
                    {key}
                  </code>
                  <span className="text-sm font-semibold text-zinc-950">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-zinc-950 p-4 text-sm text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Zap className="size-4 text-cyan-300" aria-hidden="true" />
                POST /api/ingest
              </div>
              <p className="mt-2 text-zinc-300">
                Dashboard membaca data yang sudah dinormalisasi, bukan membaca
                sensor secara langsung.
              </p>
            </div>
          </Card>

          {/* Validation Notes Section */}
          <Card className="animate-soft-fade">
            <SectionHeader
              limitDescriptionWidth
              label="Validasi lapangan"
              title="Data yang perlu dikonfirmasi"
              description="Gunakan daftar ini untuk memastikan pembacaan perangkat, konfigurasi tangki, dan lokasi STO sudah sesuai kondisi lapangan sebelum dipakai sebagai acuan operasional."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                "Dimensi tangki mengikuti pengukuran fisik terakhir.",
                "Konsumsi bahan bakar per jam sesuai beban genset masing-masing STO.",
                "Interval kirim data perangkat sesuai konfigurasi aktif.",
                "Koordinat manual sudah disetujui penanggung jawab lokasi.",
              ].map((note) => (
                <div
                  key={note}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-red-600"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-6 text-zinc-600">{note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
