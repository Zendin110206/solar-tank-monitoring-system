import { requirePageUser } from "@/features/auth/lib/auth-guards";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Database,
  MapPin,
  Ruler,
  Server,
  Timer,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SimpleTankVolumeChart } from "@/features/monitoring/components/simple-tank-volume-chart";
import {
  TankHorizontalCylinderScene3D,
  TankRectangularScene3D,
} from "@/features/monitoring/components/tank-rectangular-scene-3d";
import { getMonitoringReferenceData } from "@/features/monitoring/lib/monitoring-registry";
import {
  listLatestMonitoringReadingsByTankWithSource,
  listMonitoringReadingsForTank,
} from "@/features/monitoring/lib/monitoring-storage";
import { LiveRefreshControl } from "@/features/monitoring/components/live-refresh-control";
import { getMonitoringRefreshIntervalMs } from "@/features/monitoring/lib/refresh-interval";
import {
  buildSimpleTankDetail,
  type SimpleTankDetail,
} from "@/features/monitoring/lib/simple-tank-detail-model";
import { buildTankDetail } from "@/features/monitoring/lib/tank-detail-view-model";
import { mergeMonitoringReadingsById } from "@/features/monitoring/lib/latest-reading";
import type { DeviceStatus } from "@/features/monitoring/types/monitoring";

export const metadata: Metadata = {
  title: "Detail Operasional Tangki | FTM",
  description:
    "Detail operasional tangki bahan bakar untuk membaca volume, status perangkat, update terakhir, dan tren volume terbaru.",
};

export const runtime = "nodejs";

type InfoItem = {
  label: string;
  value: string;
};

type RuntimeLevelParameter = {
  label: string;
  range: string;
  description: string;
  badge: string;
  card: string;
};

const deviceStatusTone: Record<
  DeviceStatus,
  {
    badge: string;
    border: string;
    icon: string;
  }
> = {
  online: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    border: "border-emerald-200",
    icon: "text-emerald-600 bg-emerald-50 ring-emerald-100",
  },
  delayed: {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    border: "border-amber-200",
    icon: "text-amber-600 bg-amber-50 ring-amber-100",
  },
  offline: {
    badge: "bg-red-50 text-red-700 ring-red-100",
    border: "border-red-200",
    icon: "text-red-600 bg-red-50 ring-red-100",
  },
  unknown: {
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    border: "border-zinc-200",
    icon: "text-zinc-600 bg-zinc-100 ring-zinc-200",
  },
};

const runtimeLevelParameters: RuntimeLevelParameter[] = [
  {
    label: "Kritis",
    range: "< 13 jam",
    description: "Sisa runtime sudah masuk prioritas tindakan cepat.",
    badge: "bg-red-50 text-red-700 ring-red-100",
    card: "border-red-200 bg-red-50",
  },
  {
    label: "Threshold Under",
    range: "13 - <14 jam",
    description: "Mendekati batas bawah dan perlu dipantau lebih rapat.",
    badge: "bg-orange-50 text-orange-700 ring-orange-100",
    card: "border-orange-200 bg-orange-50",
  },
  {
    label: "Under",
    range: "14 - <16 jam",
    description: "Masih di bawah zona ideal operasional.",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    card: "border-amber-200 bg-amber-50",
  },
  {
    label: "Threshold Upper",
    range: "16 - <19 jam",
    description: "Sudah melewati batas bawah dan menuju zona atas.",
    badge: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    card: "border-cyan-200 bg-cyan-50",
  },
  {
    label: "Upper",
    range: "19 - <24 jam",
    description: "Runtime berada di zona atas yang masih normal.",
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    card: "border-blue-200 bg-blue-50",
  },
  {
    label: "Overstock",
    range: ">= 24 jam",
    description: "Cadangan runtime sangat panjang dibanding batas parameter.",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    card: "border-emerald-200 bg-emerald-50",
  },
];

const unknownRuntimeLevel: RuntimeLevelParameter = {
  label: "Belum terbaca",
  range: "-",
  description: "Parameter sisa jam menunggu data volume valid.",
  badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  card: "border-zinc-200 bg-zinc-50",
};

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits,
  }).format(value);
}

function formatRuntimeHour(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, 2)} jam`;
}

function formatMeasurement(value: number | null, unit: string) {
  return value === null || !Number.isFinite(value) ? "-" : `${value} ${unit}`;
}

function getRuntimeLevelParameter(
  runtimeHour: number | null,
): RuntimeLevelParameter {
  if (runtimeHour === null || !Number.isFinite(runtimeHour)) {
    return unknownRuntimeLevel;
  }

  if (runtimeHour < 13) {
    return runtimeLevelParameters[0];
  }

  if (runtimeHour < 14) {
    return runtimeLevelParameters[1];
  }

  if (runtimeHour < 16) {
    return runtimeLevelParameters[2];
  }

  if (runtimeHour < 19) {
    return runtimeLevelParameters[3];
  }

  if (runtimeHour < 24) {
    return runtimeLevelParameters[4];
  }

  return runtimeLevelParameters[5];
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function StatusBadge({ tank }: { tank: SimpleTankDetail }) {
  const tone = deviceStatusTone[tank.deviceStatus];

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${tone.badge}`}
    >
      {tank.deviceStatusLabel}
    </span>
  );
}

function TankVisualPreview({ tank }: { tank: SimpleTankDetail }) {
  const fillPercent = tank.hasReading ? clampPercent(tank.fillPercent) : 0;

  return (
    <div className="relative min-h-64 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-sm sm:min-h-72">
      {tank.shape === "rectangular" ? (
        <TankRectangularScene3D
          fillPercent={fillPercent}
          fuelHeightCm={tank.fuelHeightCm}
          heightCm={tank.heightCm}
          lengthCm={tank.lengthCm}
          sensorDistanceCm={tank.sensorDistanceCm}
          showMeasurementBadges={false}
          widthCm={tank.widthCm}
        />
      ) : (
        <TankHorizontalCylinderScene3D
          diameterCm={tank.diameterCm}
          fillPercent={fillPercent}
          fuelHeightCm={tank.fuelHeightCm}
          lengthCm={tank.lengthCm}
          sensorDistanceCm={tank.sensorDistanceCm}
          showMeasurementBadges={false}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-lg ring-1 ${tone}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold text-zinc-950">
            {value}
          </p>
          <p className="mt-1 text-sm leading-5 text-zinc-500">{note}</p>
        </div>
      </div>
    </article>
  );
}

function RuntimeParameterPanel({ tank }: { tank: SimpleTankDetail }) {
  const activeParameter = getRuntimeLevelParameter(
    tank.hasReading ? tank.runtimeHour : null,
  );

  return (
    <article className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Timer className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">
            Sisa jam
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
            Level parameter runtime
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Kategori ini membaca sisa runtime genset agar operator tahu posisi
            tangki terhadap batas operasional.
          </p>
        </div>
      </div>

      <div className={`mt-5 rounded-lg border p-4 ${activeParameter.card}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Parameter aktif
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {activeParameter.label}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${activeParameter.badge}`}
          >
            {tank.hasReading ? formatRuntimeHour(tank.runtimeHour) : "-"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {activeParameter.description}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {runtimeLevelParameters.map((parameter) => {
          const isActive = parameter.label === activeParameter.label;

          return (
            <div
              className={`rounded-lg border p-3 ${
                isActive ? parameter.card : "border-zinc-200 bg-zinc-50"
              }`}
              key={parameter.label}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-zinc-950">
                  {parameter.label}
                </span>
                <span className="text-xs font-semibold text-zinc-500">
                  {parameter.range}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function TankDimensionPanel({ tank }: { tank: SimpleTankDetail }) {
  const dimensionItems: InfoItem[] =
    tank.shape === "rectangular"
      ? [
          { label: "Panjang", value: formatMeasurement(tank.lengthCm, "cm") },
          { label: "Lebar", value: formatMeasurement(tank.widthCm, "cm") },
          { label: "Tinggi", value: formatMeasurement(tank.heightCm, "cm") },
        ]
      : [
          { label: "Panjang", value: formatMeasurement(tank.lengthCm, "cm") },
          {
            label: "Diameter",
            value: formatMeasurement(tank.diameterCm, "cm"),
          },
        ];

  return (
    <article className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Ruler className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">
            Bentuk tangki
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
            {tank.shapeLabel}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Ukuran fisik utama yang membantu operator mengenali konfigurasi
            tangki.
          </p>
        </div>
      </div>

      <InfoList
        items={[
          ...dimensionItems,
          {
            label: "Kapasitas",
            value: `${formatLiter(tank.capacityLiter)} L`,
          },
          {
            label: "Konsumsi/jam",
            value: `${formatNumber(tank.consumptionLiterPerHour, 2)} L/jam`,
          },
        ]}
      />
    </article>
  );
}

function InfoList({ items }: { items: InfoItem[] }) {
  return (
    <dl className="mt-4 divide-y divide-zinc-100 text-sm">
      {items.map((item) => (
        <div
          className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          key={item.label}
        >
          <dt className="text-zinc-500">{item.label}</dt>
          <dd className="max-w-[58%] text-right font-semibold text-zinc-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SimpleTankDetailPage({
  params,
}: {
  params: Promise<{ tankId: string }>;
}) {
  const { tankId } = await params;

  await connection();
  const user = await requirePageUser();
  const isAdmin = user.role === "admin";

  const now = new Date();
  const refreshIntervalMs = getMonitoringRefreshIntervalMs();
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

  const tank = buildSimpleTankDetail(tankView, tankHistoryReadings);
  const statusTone = deviceStatusTone[tank.deviceStatus];
  const infoItems: InfoItem[] = [
    { label: "Area", value: tank.areaLabel },
    { label: "Perangkat", value: tank.deviceCode },
    { label: "Jenis tangki", value: tank.shapeLabel },
    { label: "Kapasitas", value: `${formatLiter(tank.capacityLiter)} L` },
    {
      label: "Sisa jam",
      value: tank.hasReading ? formatRuntimeHour(tank.runtimeHour) : "-",
    },
    { label: "Pembacaan", value: tank.measuredAtLabel },
  ];

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[
          { href: "/dashboard", label: "Manajemen Tangki" },
          { current: true, label: "Detail Operasional" },
          ...(isAdmin
            ? [{ href: "/dashboard/detail", label: "Analisis Teknis" }]
            : []),
        ]}
        user={user}
      />

      <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke dashboard
          </Link>
          <p className="text-sm font-medium text-zinc-500">
            Detail operasional untuk pemantauan harian
          </p>
          <LiveRefreshControl
            className="flex"
            intervalMs={refreshIntervalMs}
            lastSyncedLabel={`Update ${tank.lastUpdateLabel}`}
          />
        </div>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <article
            className={`min-w-0 overflow-hidden rounded-lg border bg-white p-5 shadow-sm ${statusTone.border}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase text-zinc-500">
                  {tank.siteCode} - {tank.areaLabel}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
                  {tank.siteName}
                </h1>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  {tank.tankName}
                </p>
              </div>
              <StatusBadge tank={tank} />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(20rem,1fr)] lg:items-center">
              <div className="min-w-0">
                <p className="text-base font-medium text-zinc-500">
                  Isi tangki
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
                  {formatLiter(tank.volumeLiter)} /{" "}
                  {formatLiter(tank.capacityLiter)} L
                </p>
                <p className="mt-2 text-base text-zinc-500">
                  saat ini / kapasitas maksimal
                </p>
              </div>

              <TankVisualPreview tank={tank} />
            </div>
          </article>

          <div className="grid min-w-0 gap-3">
            <SummaryCard
              icon={Wifi}
              label="Status perangkat"
              note={`Update terakhir ${tank.lastUpdateLabel}`}
              tone={statusTone.icon}
              value={tank.deviceStatusLabel}
            />
            <SummaryCard
              icon={Activity}
              label="Sisa jam"
              note={`Konsumsi ${formatNumber(tank.consumptionLiterPerHour, 2)} L/jam`}
              tone="bg-blue-50 text-blue-700 ring-blue-100"
              value={tank.hasReading ? formatRuntimeHour(tank.runtimeHour) : "-"}
            />
            <SummaryCard
              icon={Clock3}
              label="Data diterima"
              note="Waktu terakhir data masuk ke sistem"
              tone="bg-blue-50 text-blue-700 ring-blue-100"
              value={tank.receivedAtLabel}
            />
            <SummaryCard
              icon={Database}
              label="Perangkat"
              note={tank.deviceLabel}
              tone="bg-zinc-100 text-zinc-700 ring-zinc-200"
              value={tank.deviceCode}
            />
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-zinc-500">
                  Tren volume
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
                  Perubahan isi tangki
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Pilih rentang tren harian, mingguan, atau bulanan. CSV yang
                  diunduh mengikuti rentang tersebut.
                </p>
              </div>
            </div>

            <SimpleTankVolumeChart
              capacityLiter={tank.capacityLiter}
              exportHrefBase={`/api/tanks/${tank.id}/readings/export`}
              trends={tank.chartTrends}
            />
          </article>

          <RuntimeParameterPanel tank={tank} />
        </section>

        <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <TankDimensionPanel tank={tank} />

          <article className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-zinc-500">
                  Informasi operasional
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-normal text-zinc-950">
                  {tank.siteCode}
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Data utama yang biasa dibutuhkan operator saat membuka detail
                  satu STO.
                </p>
              </div>
            </div>

            <InfoList items={infoItems} />

            <Link
              href="/dashboard"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
            >
              <Server className="size-4" aria-hidden="true" />
              Lihat semua STO
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
