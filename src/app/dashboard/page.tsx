import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Database,
  Droplets,
  Fuel,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import {
  buildDashboardOverview,
  type DashboardMonitoringSite as MonitoringSite,
  type DashboardOverview,
  type DashboardSiteStatus as SiteStatus,
} from "@/features/monitoring/lib/dashboard-view-model";

import { getMonitoringReadings } from "@/features/monitoring/lib/telemetry-store";

export const metadata: Metadata = {
  title: "Dashboard Monitoring Solar | SolarTank",
  description:
    "Dashboard awal untuk memantau volume tangki solar, runtime genset, status perangkat, dan lokasi STO berbasis simulator serta API lokal.",
};

const statusMeta: Record<
  SiteStatus,
  {
    label: string;
    dot: string;
    badge: string;
    ring: string;
    text: string;
  }
> = {
  online: {
    label: "Online",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    ring: "ring-emerald-200",
    text: "text-emerald-700",
  },
  warning: {
    label: "Waspada",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    ring: "ring-amber-200",
    text: "text-amber-700",
  },
  critical: {
    label: "Kritis",
    dot: "bg-red-600",
    badge: "bg-red-50 text-red-700 ring-red-100",
    ring: "ring-red-200",
    text: "text-red-700",
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-950",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    ring: "ring-zinc-300",
    text: "text-zinc-700",
  },
};

function buildSummaryCards(dashboardOverview: DashboardOverview) {
  return [
    {
      label: "STO terpantau",
      value: String(dashboardOverview.summary.totalSites),
      note: `${dashboardOverview.summary.totalTanks} tangki terpantau`,
      icon: MapPin,
      tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    },
    {
      label: "Tangki kritis",
      value: String(dashboardOverview.summary.criticalTanks),
      note: "berdasarkan runtime, level, dan device",
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-700 ring-red-100",
    },
    {
      label: "Perangkat online",
      value: String(dashboardOverview.summary.onlineDevices),
      note: `${dashboardOverview.summary.delayedDevices} terlambat, ${dashboardOverview.summary.offlineDevices} offline`,
      icon: Wifi,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      label: "Rata-rata update",
      value: dashboardOverview.summary.averageIntervalLabel,
      note: "target dapat diatur per device",
      icon: Clock,
      tone: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    },
  ];
}

const runtimeBands = [
  { label: "Kritis", range: "< 13 jam", width: "24%", tone: "bg-red-500" },
  {
    label: "Waspada",
    range: "13 - 16 jam",
    width: "24%",
    tone: "bg-amber-500",
  },
  {
    label: "Aman terbatas",
    range: "16 - 24 jam",
    width: "24%",
    tone: "bg-cyan-500",
  },
  {
    label: "Aman panjang",
    range: "> 24 jam",
    width: "28%",
    tone: "bg-emerald-500",
  },
];

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function StatusBadge({ status }: { status: SiteStatus }) {
  const meta = statusMeta[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.badge}`}
    >
      <span className={`size-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function LocationMarker({ site }: { site: MonitoringSite }) {
  const meta = statusMeta[site.status];
  const markerStyle = {
    left: site.left,
    top: site.top,
  } satisfies CSSProperties;

  return (
    <div className="group absolute z-20" style={markerStyle}>
      <button
        type="button"
        className={`relative grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg shadow-zinc-400/20 ring-4 transition duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${meta.ring}`}
        aria-label={`${site.name}, status ${meta.label}`}
      >
        <span className={`size-3.5 rounded-full ${meta.dot}`} />
      </button>

      <div className="pointer-events-none absolute left-1/2 top-7 hidden w-64 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-2xl shadow-zinc-300/50 group-hover:block group-focus-within:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">{site.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{site.deviceId}</p>
          </div>
          <StatusBadge status={site.status} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-zinc-50 p-2">
            <p className="text-zinc-400">Isi</p>
            <p className="mt-1 font-semibold text-zinc-950">
              {site.fillPercent}%
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2">
            <p className="text-zinc-400">Runtime</p>
            <p className="mt-1 font-semibold text-zinc-950">
              {site.runtimeHour} jam
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2">
            <p className="text-zinc-400">Update</p>
            <p className="mt-1 font-semibold text-zinc-950">
              {site.updateLabel}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">{site.note}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await connection();

  const dashboardOverview = buildDashboardOverview({
    now: new Date(),
    readings: getMonitoringReadings(),
  });
  const monitoredSites = dashboardOverview.rows;
  const latestSite = dashboardOverview.latestRow;
  const prioritySites = dashboardOverview.priorityRows;
  const trendBars = dashboardOverview.trendBars;
  const summaryCards = buildSummaryCards(dashboardOverview);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 overflow-hidden border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Kembali ke beranda SolarTank"
          >
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 lg:flex">
            <a href="#ringkasan" className="text-zinc-950">
              Ringkasan
            </a>
            <a href="#peta" className="transition hover:text-red-600">
              Peta STO
            </a>
            <a href="#prioritas" className="transition hover:text-red-600">
              Prioritas
            </a>
            <a href="#log" className="transition hover:text-red-600">
              Log Perangkat
            </a>
          </nav>

          <div className="ml-auto hidden min-w-[22rem] max-w-md flex-1 items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-400 xl:flex">
            <Search className="size-4" aria-hidden="true" />
            <span>Cari STO, device, atau status operasional...</span>
          </div>

          <div className="ml-auto flex items-center gap-3 xl:ml-0">
            <div className="hidden items-center gap-2 text-sm text-zinc-500 md:flex">
              <ShieldCheck
                className="size-4 text-emerald-600"
                aria-hidden="true"
              />
              <span>{dashboardOverview.summary.syncLabel}</span>
            </div>
            <button
              type="button"
              className="relative hidden size-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-red-200 hover:text-red-600 sm:grid"
              aria-label="Notifikasi"
            >
              <Bell className="size-4" aria-hidden="true" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            </button>
            <div className="grid size-10 place-items-center rounded-full bg-red-600 text-sm font-semibold text-white">
              ZA
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Dashboard Toolbar */}
        <section
          id="ringkasan"
          className="animate-soft-fade mb-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                  Data simulator/API
                </span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
                  memory store lokal
                </span>
              </div>
              <h1 className="mt-3 max-w-full text-[2rem] font-semibold leading-[1.08] tracking-normal text-zinc-950 sm:text-4xl">
                Monitoring tangki solar STO
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                Tampilan awal untuk membaca volume, estimasi runtime genset,
                status perangkat, dan titik lokasi manual sebelum database
                permanen serta sensor asli disambungkan.
              </p>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:w-[28rem]">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Local time
                </p>
                <p className="mt-1 text-lg font-semibold">14:45 WIB</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Sumber data
                </p>
                <p className="mt-1 text-lg font-semibold">Memory/API</p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-normal">
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={`grid size-11 place-items-center rounded-lg ring-1 ${card.tone}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-sm text-zinc-500">{card.note}</p>
              </article>
            );
          })}
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_0.82fr]">
          <div className="space-y-5">
            {/* Map Monitoring Section */}
            <section
              id="peta"
              className="animate-soft-fade overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <SectionHeader
                  label="Peta monitoring"
                  title="Lokasi STO berdasarkan input manual"
                  description="Titik peta memakai koordinat contoh yang nantinya dapat diisi manual karena perangkat tidak memakai modul GPS."
                />

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
                  {(
                    ["online", "warning", "critical", "offline"] as SiteStatus[]
                  ).map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2"
                    >
                      <span
                        className={`size-2 rounded-full ${statusMeta[status].dot}`}
                      />
                      {statusMeta[status].label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[31rem] overflow-hidden bg-[#dff7f5]">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.35), transparent 24%), radial-gradient(circle at 70% 15%, rgba(132, 204, 22, 0.25), transparent 28%), radial-gradient(circle at 48% 74%, rgba(250, 204, 21, 0.28), transparent 25%), linear-gradient(135deg, rgba(255,255,255,0.78), rgba(236, 253, 245, 0.64))",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      "linear-gradient(25deg, transparent 47%, rgba(113, 113, 122, .2) 48%, rgba(113, 113, 122, .2) 49%, transparent 50%), linear-gradient(95deg, transparent 47%, rgba(14, 165, 233, .24) 48%, rgba(14, 165, 233, .24) 49%, transparent 50%)",
                    backgroundSize: "92px 92px, 124px 124px",
                  }}
                />

                <div className="absolute left-6 top-6 z-10 rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-lg shadow-zinc-300/30 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <AlertTriangle
                      className="size-4 text-red-600"
                      aria-hidden="true"
                    />
                    {prioritySites.length} status perlu perhatian
                  </div>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">
                    Prioritas dihitung dari runtime, umur data terakhir, dan
                    status perangkat.
                  </p>
                </div>

                <div className="absolute bottom-5 left-6 z-10 rounded-lg border border-zinc-200 bg-white/90 px-4 py-3 shadow-lg shadow-zinc-300/30 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Area demo
                  </p>
                  <p className="mt-1 text-lg font-semibold">Pasuruan Raya</p>
                </div>

                <div className="absolute right-5 top-5 z-10 grid gap-2">
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-lg border border-zinc-200 bg-white text-lg font-semibold shadow-sm"
                    aria-label="Perbesar peta"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-lg border border-zinc-200 bg-white text-lg font-semibold shadow-sm"
                    aria-label="Perkecil peta"
                  >
                    -
                  </button>
                </div>

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 1000 560"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M70 330 C210 250 340 290 460 220 C580 148 680 192 870 116"
                    stroke="#ffffff"
                    strokeWidth="28"
                    strokeLinecap="round"
                  />
                  <path
                    d="M90 410 C260 380 360 445 530 350 C680 266 770 320 920 260"
                    stroke="#ffffff"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <path
                    d="M180 120 C280 210 310 300 420 380 C540 466 660 438 820 488"
                    stroke="#ffffff"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M70 330 C210 250 340 290 460 220 C580 148 680 192 870 116"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="8 10"
                  />
                  <path
                    d="M90 410 C260 380 360 445 530 350 C680 266 770 320 920 260"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="8 10"
                  />
                </svg>

                {monitoredSites.map((site) => (
                  <LocationMarker key={site.code} site={site} />
                ))}
              </div>
            </section>

            {/* Lower Insights Section */}
            <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <article
                id="prioritas"
                className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <SectionHeader
                  label="Prioritas"
                  title="Tindak lanjut hari ini"
                  description="Daftar ini membantu memilih lokasi yang perlu dicek lebih dulu."
                />

                <div className="mt-5 space-y-3">
                  {prioritySites.map((site, index) => (
                    <div
                      key={site.code}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-zinc-950">
                              {site.name}
                            </p>
                            <StatusBadge status={site.status} />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            {site.note}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-5 w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
                >
                  Lihat semua prioritas
                </button>
              </article>

              <article className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <SectionHeader
                    label="Tren volume"
                    title="Pergerakan stok 24 jam"
                    description="Grafik ini membaca seri pembacaan dari memory store lokal dan disiapkan untuk riwayat database."
                  />
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    data stabil
                  </span>
                </div>

                <div className="mt-8 flex h-64 items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                  {trendBars.map((bar) => (
                    <div
                      key={bar.hour}
                      className="flex h-full flex-1 flex-col justify-end gap-2"
                    >
                      <div className="relative flex flex-1 items-end">
                        <span
                          className={`w-full rounded-t-lg ${
                            bar.value <= 38
                              ? "bg-red-500"
                              : bar.value <= 49
                                ? "bg-amber-500"
                                : "bg-cyan-500"
                          }`}
                          style={{ height: `${bar.value}%` }}
                        />
                      </div>
                      <span className="text-center text-[0.68rem] font-medium text-zinc-400">
                        {bar.hour}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {runtimeBands.map((band) => (
                    <div
                      key={band.label}
                      className="rounded-lg border border-zinc-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${band.tone}`}
                        />
                        <span className="text-sm font-semibold text-zinc-950">
                          {band.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">{band.range}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>

          {/* Right Detail Overview */}
          <aside className="space-y-5">
            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-500">
                    Detail overview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {latestSite.name}
                  </h2>
                </div>
                <StatusBadge status={latestSite.status} />
              </div>

              <div className="mt-6 flex items-start gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Fuel className="size-8" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-semibold tracking-normal">
                      {latestSite.fillPercent}
                    </p>
                    <span className="pb-2 text-xl font-semibold text-zinc-400">
                      %
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {formatLiter(latestSite.volumeLiter)} liter tersedia.
                    Runtime estimasi {latestSite.runtimeHour} jam dengan asumsi
                    konsumsi konfigurasi {latestSite.consumptionLiterPerHour}{" "}
                    L/jam.
                  </p>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{ width: `${latestSite.fillPercent}%` }}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["Volume", `${formatLiter(latestSite.volumeLiter)} L`],
                  ["Runtime", `${latestSite.runtimeHour} jam`],
                  ["RSSI", latestSite.signal],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-xs font-medium text-zinc-400">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={`/dashboard/tanks/${latestSite.tankId}`}
                className="mt-6 block w-full rounded-lg bg-zinc-100 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
              >
                Buka detail tangki
              </Link>
            </section>

            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionHeader
                label="Kesehatan data"
                title="Status perangkat"
                description="Status mengikuti umur data terakhir dibanding interval kirim yang diharapkan."
              />

              <div className="mt-6 grid grid-cols-2 gap-3">
                {dashboardOverview.healthCards.map(({ label, value, tone }) => (
                  <div key={label} className={`rounded-lg p-4 ${tone}`}>
                    <p className="text-sm font-medium opacity-80">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div className="flex h-full">
                  {dashboardOverview.healthSegments.map((segment) => (
                    <span
                      key={segment.label}
                      className={segment.tone}
                      style={{ width: segment.width }}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionHeader
                label="Alur data"
                title="Siap disambung bertahap"
                description="Dashboard sekarang membaca memory store dan endpoint API lokal sebelum masuk ke database permanen."
              />

              <div className="mt-6 space-y-3">
                {[
                  [Database, "Memory store", "menerima data dari simulator"],
                  [Activity, "API /ingest", "menerima payload simulator"],
                  [Gauge, "Runtime", "status dihitung dari volume"],
                  [
                    Droplets,
                    "History",
                    "riwayat sementara dari memory store",
                  ],
                ].map(([Icon, title, body]) => (
                  <div
                    key={title as string}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-red-600 ring-1 ring-zinc-200">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        {title as string}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {body as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Monitoring Table Section */}
        <section
          id="log"
          className="mt-5 animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              label="Log perangkat"
              title="Daftar monitoring tangki"
              description="Tabel ini membaca data monitoring dari memory store lokal yang juga dipakai endpoint API."
            />
            <Link
              href={`/dashboard/tanks/${latestSite.tankId}`}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
            >
              Masuk ke detail dashboard
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-4 py-2 font-semibold">STO</th>
                  <th className="px-4 py-2 font-semibold">Tangki</th>
                  <th className="px-4 py-2 font-semibold">Volume</th>
                  <th className="px-4 py-2 font-semibold">Isi</th>
                  <th className="px-4 py-2 font-semibold">Runtime</th>
                  <th className="px-4 py-2 font-semibold">Device</th>
                  <th className="px-4 py-2 font-semibold">Update</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {monitoredSites.map((site) => (
                  <tr key={site.code} className="bg-zinc-50">
                    <td className="rounded-l-lg px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-2.5 rounded-full ${statusMeta[site.status].dot}`}
                        />
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {site.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {site.areaLabel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">{site.tank}</td>
                    <td className="px-4 py-4 font-semibold">
                      {formatLiter(site.volumeLiter)} L
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                          <span
                            className={`block h-full rounded-full ${
                              site.fillPercent < 25
                                ? "bg-red-500"
                                : site.fillPercent < 45
                                  ? "bg-amber-500"
                                  : "bg-cyan-500"
                            }`}
                            style={{ width: `${site.fillPercent}%` }}
                          />
                        </div>
                        <span className="font-semibold">
                          {site.fillPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{site.runtimeHour} jam</td>
                    <td className="px-4 py-4 text-zinc-600">{site.deviceId}</td>
                    <td className="px-4 py-4 text-zinc-600">
                      {site.updateLabel}
                    </td>
                    <td className="rounded-r-lg px-4 py-4">
                      <StatusBadge status={site.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
