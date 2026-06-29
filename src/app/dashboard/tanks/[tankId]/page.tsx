import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Battery,
  Clock,
  Database,
  Droplets,
  Fuel,
  Gauge,
  History,
  MapPin,
  Radio,
  Ruler,
  Settings,
  Wifi,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LiveRefreshControl } from "@/features/monitoring/components/live-refresh-control";
import { getMonitoringReferenceData } from "@/features/monitoring/lib/monitoring-registry";
import {
  buildTankDetail,
  type NearbyTankSite,
  type TankDetailStatus,
  type TankDetailView,
  type TankReadingPoint,
} from "@/features/monitoring/lib/tank-detail-view-model";
import { listMonitoringReadings } from "@/features/monitoring/lib/monitoring-storage";
import { getMonitoringRefreshIntervalMs } from "@/features/monitoring/lib/refresh-interval";
import type { TankShape } from "@/features/monitoring/types/monitoring";

export const metadata: Metadata = {
  title: "Detail Tangki Solar | SolarTank",
  description:
    "Halaman detail frontend untuk membaca kondisi satu tangki solar, visual isi tangki, parameter perangkat, dan riwayat pembacaan.",
};

export const runtime = "nodejs";

type TankStatus = TankDetailStatus;

type ReadingPoint = {
  time: string;
  percent: number;
  volumeLiter: number;
  distanceCm: number;
};

type TimelineItem = {
  label: string;
  value: string;
  detail: string;
};

type ParameterItem = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
};

type RuntimeLevelParameter = {
  label: string;
  range: string;
  description: string;
  badge: string;
  card: string;
  dot: string;
};

type NearbySite = {
  tankId: string;
  code: string;
  name: string;
  status: TankStatus;
  left: string;
  top: string;
  runtimeHour: number;
};

type TankDetail = {
  id: string;
  hasReading: boolean;
  siteCode: string;
  siteName: string;
  areaLabel: string;
  tankName: string;
  status: TankStatus;
  statusNote: string;
  fillPercent: number;
  volumeLiter: number;
  capacityLiter: number;
  shape: TankShape;
  shapeLabel: string;
  runtimeHour: number;
  consumptionLiterPerHour: number;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  diameterCm: number | null;
  lengthCm: number | null;
  heightCm: number | null;
  widthCm: number | null;
  sensorMountHeightCm: number;
  lowLevelPercent: number;
  criticalLevelPercent: number;
  deviceId: string;
  deviceLabel: string;
  expectedIntervalMin: number;
  lastUpdateLabel: string;
  measuredAtLabel: string;
  receivedAtLabel: string;
  rssiDbm: number | null;
  batteryVolt: number | null;
  coordinateLabel: string;
  markerLeft: string;
  markerTop: string;
  rawPayload: {
    distance: number;
    H_cm: number;
    volume: number;
    percent: number;
    wifi_rssi: number | null;
  };
  readings: ReadingPoint[];
  nearbySites: NearbySite[];
};

const statusMeta: Record<
  TankStatus,
  {
    label: string;
    dot: string;
    badge: string;
    ring: string;
    text: string;
    soft: string;
  }
> = {
  online: {
    label: "Online",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    ring: "ring-emerald-200",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
  },
  warning: {
    label: "Waspada",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    ring: "ring-amber-200",
    text: "text-amber-700",
    soft: "bg-amber-50",
  },
  critical: {
    label: "Kritis",
    dot: "bg-red-600",
    badge: "bg-red-50 text-red-700 ring-red-100",
    ring: "ring-red-200",
    text: "text-red-700",
    soft: "bg-red-50",
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-950",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    ring: "ring-zinc-300",
    text: "text-zinc-700",
    soft: "bg-zinc-100",
  },
};

const runtimeLevelParameters: RuntimeLevelParameter[] = [
  {
    label: "Kritis",
    range: "< 13 jam",
    description: "Sisa runtime sudah masuk prioritas tindakan cepat.",
    badge: "bg-red-50 text-red-700 ring-red-100",
    card: "border-red-200 bg-red-50",
    dot: "bg-red-600",
  },
  {
    label: "Threshold Under",
    range: "13 - <14 jam",
    description: "Mendekati batas bawah dan perlu dipantau lebih rapat.",
    badge: "bg-orange-50 text-orange-700 ring-orange-100",
    card: "border-orange-200 bg-orange-50",
    dot: "bg-orange-500",
  },
  {
    label: "Under",
    range: "14 - <16 jam",
    description: "Masih di bawah zona ideal operasional.",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    card: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    label: "Threshold Upper",
    range: "16 - <19 jam",
    description: "Sudah melewati batas bawah dan menuju zona atas.",
    badge: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    card: "border-cyan-200 bg-cyan-50",
    dot: "bg-cyan-500",
  },
  {
    label: "Upper",
    range: "19 - <24 jam",
    description: "Runtime berada di zona atas yang masih normal.",
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    card: "border-blue-200 bg-blue-50",
    dot: "bg-blue-600",
  },
  {
    label: "Overstock",
    range: ">= 24 jam",
    description: "Cadangan runtime sangat panjang dibanding batas parameter.",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    card: "border-emerald-200 bg-emerald-50",
    dot: "bg-emerald-600",
  },
];

const unknownRuntimeLevel: RuntimeLevelParameter = {
  label: "Belum terbaca",
  range: "-",
  description: "Parameter sisa jam menunggu data volume dan konsumsi valid.",
  badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  card: "border-zinc-200 bg-zinc-50",
  dot: "bg-zinc-400",
};

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatMeasurement(value: number | null, unit: string) {
  return value === null ? "-" : `${value} ${unit}`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatRuntimeHour(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)} jam`;
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
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

function toReadingPoint(reading: TankReadingPoint): ReadingPoint {
  return {
    time: reading.timeLabel,
    percent: reading.fillPercent,
    volumeLiter: reading.volumeLiter,
    distanceCm: reading.sensorDistanceCm,
  };
}

function toNearbySite(site: NearbyTankSite): NearbySite {
  return {
    tankId: site.tankId,
    code: site.code,
    name: site.name,
    status: site.status,
    left: site.left,
    top: site.top,
    runtimeHour: site.runtimeHour,
  };
}

function toTankDetail(view: TankDetailView): TankDetail {
  return {
    id: view.id,
    hasReading: view.hasReading,
    siteCode: view.siteCode,
    siteName: view.siteName,
    areaLabel: view.areaLabel,
    tankName: view.tankName,
    status: view.status,
    statusNote: view.statusNote,
    fillPercent: view.fillPercent,
    volumeLiter: view.volumeLiter,
    capacityLiter: view.capacityLiter,
    shape: view.shape,
    shapeLabel: view.shapeLabel,
    runtimeHour: view.runtimeHour,
    consumptionLiterPerHour: view.consumptionLiterPerHour,
    sensorDistanceCm: view.sensorDistanceCm,
    fuelHeightCm: view.fuelHeightCm,
    diameterCm: view.diameterCm,
    lengthCm: view.lengthCm,
    heightCm: view.heightCm,
    widthCm: view.widthCm,
    sensorMountHeightCm: view.sensorMountHeightCm,
    lowLevelPercent: view.lowLevelPercent,
    criticalLevelPercent: view.criticalLevelPercent,
    deviceId: view.deviceCode,
    deviceLabel: view.deviceLabel,
    expectedIntervalMin: view.expectedIntervalMin,
    lastUpdateLabel: view.lastUpdateLabel,
    measuredAtLabel: view.measuredAtLabel,
    receivedAtLabel: view.receivedAtLabel,
    rssiDbm: view.rssiDbm,
    batteryVolt: view.batteryVolt,
    coordinateLabel: view.coordinate.label,
    markerLeft: view.coordinate.markerLeft,
    markerTop: view.coordinate.markerTop,
    rawPayload: {
      distance: view.rawPayloadPreview.distance,
      H_cm: view.rawPayloadPreview.H_cm,
      volume: view.rawPayloadPreview.volume,
      percent: view.rawPayloadPreview.percent,
      wifi_rssi: view.rawPayloadPreview.wifi_rssi,
    },
    readings: view.readings.map(toReadingPoint),
    nearbySites: view.nearbySites.map(toNearbySite),
  };
}

function StatusBadge({ status }: { status: TankStatus }) {
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

function SectionHeading({
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
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function MetricCard({
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
    <article className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
            {value}
          </p>
        </div>
        <span
          className={`grid size-11 place-items-center rounded-lg ring-1 ${tone}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm text-zinc-500">{note}</p>
    </article>
  );
}

function TankLevelGraphic({
  fillPercent,
  isRectangular,
}: {
  fillPercent: number;
  isRectangular: boolean;
}) {
  const fillStyle = {
    height: `${fillPercent}%`,
  } satisfies CSSProperties;
  const sensorDropStyle = {
    height: `${Math.max(7, 100 - fillPercent)}%`,
  } satisfies CSSProperties;
  const surfaceStyle = {
    bottom: `${fillPercent}%`,
  } satisfies CSSProperties;

  if (isRectangular) {
    return (
      <div className="relative mx-auto h-56 max-w-md px-6 pt-7">
        <div className="absolute inset-x-16 bottom-4 h-7 rounded-full bg-slate-900/10 blur-xl" />

        <div className="relative z-10 h-44 overflow-hidden rounded-[1.35rem] border border-zinc-300 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_24px_42px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-18px_28px_rgba(15,23,42,0.08)]">
          <div
            className="absolute inset-x-0 bottom-0 overflow-visible bg-gradient-to-t from-cyan-600 via-blue-500 to-cyan-300 shadow-[inset_0_18px_28px_rgba(255,255,255,0.26),inset_0_-18px_24px_rgba(15,23,42,0.12)] transition-[height] duration-700 ease-out"
            style={fillStyle}
          >
            <div className="absolute -top-2 left-[-6%] h-5 w-[112%] rounded-[50%] bg-cyan-200/75 shadow-[0_-4px_12px_rgba(34,211,238,0.26)]" />
          </div>
          <div className="absolute inset-x-6 top-5 h-8 rounded-full bg-white/35 blur-sm" />
          <div className="absolute inset-y-4 left-5 w-10 rounded-full bg-white/18 blur-sm" />
          <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-slate-900/12 to-transparent" />
          <div
            className="absolute left-5 right-5 z-20 border-t border-dashed border-red-500 transition-[bottom] duration-700 ease-out"
            style={surfaceStyle}
          />
          <div className="absolute left-1/2 top-1.5 z-30 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-white shadow-sm ring-1 ring-red-100">
            <span className="size-3 rounded-full bg-red-600 ring-4 ring-red-100" />
          </div>
          <div
            className="absolute left-1/2 top-5 z-20 border-l-2 border-dashed border-red-500 transition-[height] duration-700 ease-out"
            style={sensorDropStyle}
          />
        </div>

        <div className="absolute bottom-5 left-[22%] h-6 w-14 rounded-b-lg bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 shadow-sm" />
        <div className="absolute bottom-5 right-[22%] h-6 w-14 rounded-b-lg bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-56 max-w-md px-6 pt-8">
      <div className="absolute inset-x-16 bottom-5 h-7 rounded-full bg-slate-900/10 blur-xl" />

      <div className="relative z-10 h-44 overflow-hidden rounded-[999px] border border-zinc-300 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_24px_42px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-20px_30px_rgba(15,23,42,0.09)]">
        <div
          className="absolute inset-x-0 bottom-0 overflow-visible bg-gradient-to-t from-cyan-600 via-blue-500 to-cyan-300 shadow-[inset_0_18px_28px_rgba(255,255,255,0.28),inset_0_-18px_24px_rgba(15,23,42,0.12)] transition-[height] duration-700 ease-out"
          style={fillStyle}
        >
          <div className="absolute -top-2 left-[-5%] h-5 w-[110%] rounded-[50%] bg-cyan-200/80 shadow-[0_-4px_12px_rgba(34,211,238,0.28)]" />
        </div>
        <div className="absolute inset-x-16 top-5 h-8 rounded-full bg-white/35 blur-sm" />
        <div className="absolute inset-x-10 bottom-4 h-5 rounded-full bg-slate-900/10 blur-sm" />
        <div
          className="absolute left-10 right-10 z-20 border-t border-dashed border-red-500 transition-[bottom] duration-700 ease-out"
          style={surfaceStyle}
        />
        <div className="absolute left-1/2 top-1.5 z-30 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-white shadow-sm ring-1 ring-red-100">
          <span className="size-3 rounded-full bg-red-600 ring-4 ring-red-100" />
        </div>
        <div
          className="absolute left-1/2 top-5 z-20 border-l-2 border-dashed border-red-500 transition-[height] duration-700 ease-out"
          style={sensorDropStyle}
        />
      </div>

      <div className="absolute bottom-5 left-[21%] h-6 w-14 rounded-b-lg bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 shadow-sm" />
      <div className="absolute bottom-5 right-[21%] h-6 w-14 rounded-b-lg bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 shadow-sm" />
    </div>
  );
}

function TankVisual({ tank }: { tank: TankDetail }) {
  const isRectangular = tank.shape === "rectangular";
  const fillPercent = tank.hasReading ? clampPercent(tank.fillPercent) : 0;
  const visualDescription = isRectangular
    ? "Model tampilan mengikuti tangki balok/persegi panjang. Sensor berada di atas, sehingga perubahan level dibaca secara vertikal."
    : "Model tampilan mengikuti tangki silinder horizontal. Sensor berada di atas, sehingga permukaan solar naik-turun secara vertikal.";
  const dimensionItems: ParameterItem[] = [
    {
      label: "Jarak sensor",
      value: tank.hasReading ? `${tank.sensorDistanceCm} cm` : "-",
      note: tank.hasReading
        ? "distance dari payload"
        : "menunggu payload perangkat",
      icon: Ruler,
    },
    {
      label: "Tinggi solar",
      value: tank.hasReading ? `${tank.fuelHeightCm} cm` : "-",
      note: tank.hasReading
        ? "raw.H_cm setelah normalisasi"
        : "menunggu pembacaan sensor",
      icon: Droplets,
    },
    {
      label: "Kapasitas tangki",
      value: `${formatLiter(tank.capacityLiter)} L`,
      note: "kapasitas konfigurasi device",
      icon: Fuel,
    },
    {
      label: "Tinggi sensor",
      value: formatMeasurement(tank.sensorMountHeightCm, "cm"),
      note: "sensor_mount_height_cm",
      icon: Radio,
    },
    {
      label: "Panjang tangki",
      value: formatMeasurement(tank.lengthCm, "cm"),
      note: "konfigurasi fisik tangki",
      icon: Settings,
    },
    ...(isRectangular
      ? [
          {
            label: "Lebar tangki",
            value: formatMeasurement(tank.widthCm, "cm"),
            note: "konfigurasi tangki balok",
            icon: Ruler,
          },
          {
            label: "Tinggi tangki",
            value: formatMeasurement(tank.heightCm, "cm"),
            note: "batas tinggi bahan bakar",
            icon: Gauge,
          },
        ]
      : [
          {
            label: "Diameter tangki",
            value: formatMeasurement(tank.diameterCm, "cm"),
            note: "konfigurasi tangki silinder",
            icon: Gauge,
          },
        ]),
    {
      label: "Konsumsi per jam",
      value: `${tank.consumptionLiterPerHour} L/jam`,
      note: "parameter estimasi runtime",
      icon: Activity,
    },
    {
      label: "Low level",
      value: formatPercent(tank.lowLevelPercent),
      note: "ambang status waspada",
      icon: AlertTriangle,
    },
    {
      label: "Critical level",
      value: formatPercent(tank.criticalLevelPercent),
      note: "ambang prioritas kritis",
      icon: Zap,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          label="Visual tangki"
          title={tank.shapeLabel}
          description={visualDescription}
        />
        <StatusBadge status={tank.status} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200">
              <Radio className="size-4 text-red-600" aria-hidden="true" />
              Sensor di atas
            </div>

            <div className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">
              {tank.hasReading ? `Isi ${tank.fillPercent}%` : "belum ada data"}
            </div>
          </div>

          <TankLevelGraphic
            fillPercent={fillPercent}
            isRectangular={isRectangular}
          />

          <div className="mt-1 grid grid-cols-3 gap-2 text-xs font-medium text-zinc-500">
            <span>0%</span>
            <span className="text-center">
              kapasitas {formatLiter(tank.capacityLiter)} L
            </span>
            <span className="text-right">100%</span>
          </div>

          <div className="mt-4 rounded-lg border border-cyan-100 bg-white p-3 text-xs leading-5 text-zinc-500">
            Garis merah menunjukkan jarak sensor dari atas ke permukaan solar.
            Area biru mengikuti tinggi solar secara vertikal, bukan kiri ke
            kanan.
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {dimensionItems.map((item, index) => {
            const Icon = item.icon;
            const shouldCenterItem =
              !isRectangular && index === dimensionItems.length - 1;

            return (
              <div
                key={item.label}
                className={`rounded-lg border border-zinc-200 bg-zinc-50 p-3 ${
                  shouldCenterItem
                    ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.375rem)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-white text-red-600 ring-1 ring-zinc-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">
                      {item.value}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {item.note}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TrendChart({ readings }: { readings: ReadingPoint[] }) {
  const maxPercent = 100;

  if (readings.length === 0) {
    return (
      <div className="mt-6 grid min-h-64 place-items-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            Belum ada riwayat pembacaan
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Tangki sudah terdaftar, tetapi perangkat belum mengirim data yang
            bisa digambar sebagai tren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex h-64 items-end gap-3">
        {readings.map((reading, index) => {
          const height = Math.max((reading.percent / maxPercent) * 100, 8);

          return (
            <div
              key={`${reading.time}-${reading.percent}-${index}`}
              className="flex h-full flex-1 flex-col justify-end gap-2"
            >
              <div className="relative flex flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg transition duration-500 ${
                    reading.percent < 25
                      ? "bg-red-500"
                      : reading.percent < 45
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-center text-[0.68rem] font-medium text-zinc-400">
                {reading.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NearbyMarker({ site }: { site: NearbySite }) {
  const meta = statusMeta[site.status];
  const markerStyle = {
    left: site.left,
    top: site.top,
  } satisfies CSSProperties;

  return (
    <div className="group absolute z-20" style={markerStyle}>
      <Link
        href={`/dashboard/tanks/${site.tankId}`}
        className={`grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg shadow-zinc-400/20 ring-4 transition duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${meta.ring}`}
        aria-label={`Buka detail ${site.name}, ${meta.label}`}
      >
        <span className={`size-3.5 rounded-full ${meta.dot}`} />
      </Link>
      <div className="pointer-events-none absolute left-1/2 top-7 hidden w-52 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-2xl shadow-zinc-300/50 group-hover:block group-focus-within:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">{site.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{site.code}</p>
          </div>
          <StatusBadge status={site.status} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Runtime estimasi {site.runtimeHour} jam.
        </p>
      </div>
    </div>
  );
}

function LocationPanel({ tank }: { tank: TankDetail }) {
  const sites = tank.nearbySites;
  return (
    <article className="animate-soft-fade overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          label="Lokasi manual"
          title="Titik STO pada peta manual"
          description="Koordinat ditampilkan sebagai input manual agar tidak bergantung pada modul GPS."
        />
        <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
          {tank.coordinateLabel}
        </span>
      </div>

      <div className="relative min-h-[28rem] overflow-hidden bg-[#dff7f5]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 22%, rgba(34, 211, 238, 0.32), transparent 24%), radial-gradient(circle at 72% 18%, rgba(132, 204, 22, 0.22), transparent 28%), radial-gradient(circle at 47% 72%, rgba(250, 204, 21, 0.24), transparent 25%), linear-gradient(135deg, rgba(255,255,255,0.8), rgba(236,253,245,0.66))",
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(28deg, transparent 47%, rgba(113,113,122,.2) 48%, rgba(113,113,122,.2) 49%, transparent 50%), linear-gradient(96deg, transparent 47%, rgba(14,165,233,.24) 48%, rgba(14,165,233,.24) 49%, transparent 50%)",
            backgroundSize: "92px 92px, 124px 124px",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 560"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M70 330 C210 250 340 290 460 220 C580 148 680 192 870 116"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeWidth="28"
          />
          <path
            d="M90 410 C260 380 360 445 530 350 C680 266 770 320 920 260"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeWidth="22"
          />
          <path
            d="M180 120 C280 210 310 300 420 380 C540 466 660 438 820 488"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeWidth="18"
          />
          <path
            d="M70 330 C210 250 340 290 460 220 C580 148 680 192 870 116"
            stroke="#94a3b8"
            strokeDasharray="8 10"
            strokeWidth="2"
          />
          <path
            d="M90 410 C260 380 360 445 530 350 C680 266 770 320 920 260"
            stroke="#94a3b8"
            strokeDasharray="8 10"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute left-5 top-5 z-10 rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-lg shadow-zinc-300/30 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <MapPin className="size-4 text-red-600" aria-hidden="true" />
            {tank.siteName}
          </div>
          <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">
            Marker aktif menunjukkan detail tangki yang sedang dibuka.
          </p>
        </div>

        {sites.map((site) => (
          <NearbyMarker key={site.code} site={site} />
        ))}

        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 p-1 ring-8 ring-red-100"
          style={{ left: tank.markerLeft, top: tank.markerTop }}
          aria-hidden="true"
        >
          <div className="size-4 rounded-full bg-white" />
        </div>
      </div>
    </article>
  );
}

function ParameterList({ items }: { items: ParameterItem[] }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-red-600 ring-1 ring-zinc-200">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-500">{item.note}</p>
          </div>
        );
      })}
    </div>
  );
}

function RuntimeParameterPanel({ tank }: { tank: TankDetail }) {
  const activeParameter = getRuntimeLevelParameter(
    tank.hasReading ? tank.runtimeHour : null,
  );

  return (
    <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <SectionHeading
        label="Sisa jam"
        title="Level parameter runtime"
        description="Kategori ini membaca sisa runtime genset agar operator tahu posisi tangki terhadap batas operasional."
      />

      <div
        className={`mt-5 rounded-lg border p-4 ${activeParameter.card}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Parameter aktif
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {activeParameter.label}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${activeParameter.badge}`}
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
              key={parameter.label}
              className={`rounded-lg border p-3 transition duration-300 ${
                isActive
                  ? `${parameter.card} ring-2 ring-blue-100`
                  : "border-zinc-200 bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${parameter.dot}`} />
                  <span className="text-sm font-semibold text-zinc-950">
                    {parameter.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-zinc-500">
                  {parameter.range}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TankConfigurationPanel({ tank }: { tank: TankDetail }) {
  const dimensionRows =
    tank.shape === "rectangular"
      ? [
          ["Panjang tangki", formatMeasurement(tank.lengthCm, "cm")],
          ["Lebar tangki", formatMeasurement(tank.widthCm, "cm")],
          ["Tinggi tangki", formatMeasurement(tank.heightCm, "cm")],
        ]
      : [
          ["Panjang tabung", formatMeasurement(tank.lengthCm, "cm")],
          ["Diameter tabung", formatMeasurement(tank.diameterCm, "cm")],
        ];
  const configRows = [
    ["Tipe visual", tank.shapeLabel],
    ["Kapasitas", `${formatLiter(tank.capacityLiter)} L`],
    ...dimensionRows,
    ["Tinggi sensor", formatMeasurement(tank.sensorMountHeightCm, "cm")],
    ["Konsumsi per jam", `${tank.consumptionLiterPerHour} L/jam`],
    ["Low level", formatPercent(tank.lowLevelPercent)],
    ["Critical level", formatPercent(tank.criticalLevelPercent)],
    ["Interval kirim", `${tank.expectedIntervalMin} menit`],
  ];

  return (
    <section
      id="konfigurasi"
      className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <SectionHeading
        label="Konfigurasi"
        title="Spesifikasi tangki dan device"
        description="Ringkasan config yang dipakai UI untuk memilih visual, menghitung volume, dan menentukan ambang operasional."
      />

      <div className="mt-6 space-y-3">
        {configRows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-zinc-500">{label}</span>
            <span className="text-right text-sm font-semibold text-zinc-950">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadingTable({ tank }: { tank: TankDetail }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            <th className="px-4 py-2 font-semibold">Jam</th>
            <th className="px-4 py-2 font-semibold">Persen</th>
            <th className="px-4 py-2 font-semibold">Volume</th>
            <th className="px-4 py-2 font-semibold">Distance</th>
            <th className="px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {tank.readings.length === 0 ? (
            <tr className="bg-zinc-50">
              <td
                colSpan={5}
                className="rounded-lg px-4 py-8 text-center text-sm text-zinc-500"
              >
                Belum ada pembacaan tersimpan untuk tangki ini.
              </td>
            </tr>
          ) : (
            tank.readings.map((reading, index) => (
              <tr
                key={`${reading.time}-${reading.volumeLiter}-${index}`}
                className="bg-zinc-50"
              >
                <td className="rounded-l-lg px-4 py-4 font-semibold text-zinc-950">
                  {reading.time}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                      <span
                        className={`block h-full rounded-full ${
                          reading.percent < 25
                            ? "bg-red-500"
                            : reading.percent < 45
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                        }`}
                        style={{ width: `${reading.percent}%` }}
                      />
                    </div>
                    <span className="font-semibold">{reading.percent}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold">
                  {formatLiter(reading.volumeLiter)} L
                </td>
                <td className="px-4 py-4 text-zinc-600">
                  {reading.distanceCm} cm
                </td>
                <td className="rounded-r-lg px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    diterima
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function TankDetailPage({
  params,
}: {
  params: Promise<{ tankId: string }>;
}) {
  const { tankId } = await params;

  await connection();

  const now = new Date();
  const [readings, referenceData] = await Promise.all([
    listMonitoringReadings(),
    getMonitoringReferenceData(),
  ]);
  const tankView = buildTankDetail(tankId, {
    now,
    sites: referenceData.sites,
    tanks: referenceData.tanks,
    devices: referenceData.devices,
    readings,
  });

  if (!tankView) {
    notFound();
  }

  const tank = toTankDetail(tankView);
  const refreshIntervalMs = getMonitoringRefreshIntervalMs();

  const status = statusMeta[tank.status];
  const runtimeLevel = getRuntimeLevelParameter(
    tank.hasReading ? tank.runtimeHour : null,
  );
  const metrics = [
    {
      label: "Volume saat ini",
      value: tank.hasReading ? `${formatLiter(tank.volumeLiter)} L` : "-",
      note: tank.hasReading
        ? `${tank.fillPercent}% dari kapasitas konfigurasi ${formatLiter(tank.capacityLiter)} L`
        : `menunggu pembacaan pertama dari perangkat, kapasitas konfigurasi ${formatLiter(tank.capacityLiter)} L`,
      icon: Fuel,
      tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    },
    {
      label: "Estimasi runtime",
      value: tank.hasReading ? formatRuntimeHour(tank.runtimeHour) : "-",
      note: tank.hasReading
        ? `berdasarkan konsumsi ${tank.consumptionLiterPerHour} L/jam, parameter ${runtimeLevel.label}`
        : `akan dihitung setelah volume terbaca, konsumsi konfigurasi ${tank.consumptionLiterPerHour} L/jam`,
      icon: Clock,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
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
      note: "nilai dari payload perangkat jika tersedia",
      icon: Radio,
      tone: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    },
  ];
  const deviceParameters: ParameterItem[] = [
    {
      label: "Device ID",
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
      note: "nilai dari payload perangkat jika tersedia",
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
      label: "Sensor membaca jarak",
      value: tank.hasReading ? `${tank.sensorDistanceCm} cm` : "-",
      detail: tank.hasReading
        ? "jarak dari sensor ke permukaan solar"
        : "belum ada jarak sensor yang diterima",
    },
    {
      label: "Tinggi solar dihitung",
      value: tank.hasReading ? `${tank.fuelHeightCm} cm` : "-",
      detail: tank.hasReading
        ? "nilai ter-normalisasi dari raw.H_cm"
        : "tinggi solar belum dihitung sebelum data masuk",
    },
    {
      label: "Volume dan persen",
      value: tank.hasReading
        ? `${formatLiter(tank.volumeLiter)} L / ${tank.fillPercent}%`
        : "-",
      detail: tank.hasReading
        ? "angka siap dipakai UI dan status"
        : "dashboard tetap menampilkan STO sambil menunggu data pertama",
    },
    {
      label: "Runtime operasional",
      value: tank.hasReading ? `${tank.runtimeHour} jam` : "-",
      detail: tank.hasReading
        ? "perkiraan durasi genset dari konsumsi per jam"
        : "runtime baru valid setelah volume solar tersedia",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      {/* Detail Header */}
      <header className="sticky top-0 z-50 overflow-hidden border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
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

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 lg:flex">
            <Link href="/dashboard" className="transition hover:text-red-600">
              Dashboard
            </Link>
            <a href="#visual" className="text-zinc-950">
              Detail Tangki
            </a>
            <a href="#riwayat" className="transition hover:text-red-600">
              Riwayat
            </a>
            <a href="#lokasi" className="transition hover:text-red-600">
              Lokasi
            </a>
            <a href="#konfigurasi" className="transition hover:text-red-600">
              Konfigurasi
            </a>
            <a href="#payload" className="transition hover:text-red-600">
              Payload
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <LiveRefreshControl
              intervalMs={refreshIntervalMs}
              lastSyncedLabel={`Update ${tank.lastUpdateLabel}`}
              className="hidden md:inline-flex"
            />
            <div className="hidden sm:block">
              <StatusBadge status={tank.status} />
            </div>
            <div className="grid size-10 place-items-center rounded-full bg-red-600 text-sm font-semibold text-white">
              ZA
            </div>
          </div>
        </div>
      </header>

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
                  data monitoring
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

            <div className="grid gap-2 text-sm sm:grid-cols-3 xl:w-[34rem]">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Site
                </p>
                <p className="mt-1 text-lg font-semibold">{tank.siteCode}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Update
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {tank.lastUpdateLabel}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Area
                </p>
                <p className="mt-1 text-lg font-semibold">{tank.areaLabel}</p>
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

        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.32fr_0.68fr]">
          <div className="min-w-0 space-y-5">
            {/* Tank Visual Section */}
            <section id="visual">
              <TankVisual tank={tank} />
            </section>

            {/* History Section */}
            <section
              id="riwayat"
              className="animate-soft-fade min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeading
                  label="Riwayat"
                  title="Pembacaan 24 jam"
                  description="Grafik ini membaca riwayat dari storage/API lokal dan strukturnya sudah mengikuti endpoint history."
                />
                <span className="block max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:w-fit">
                  {`/api/tanks/${tank.id}/readings?range=24h`}
                </span>
              </div>
              <TrendChart readings={tank.readings} />
              <ReadingTable tank={tank} />
            </section>

          </div>

          <aside className="min-w-0 space-y-5">
            {/* Device Health Section */}
            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <SectionHeading
                  label="Perangkat"
                  title="Status sensor"
                  description="Informasi ini disiapkan untuk health check perangkat saat data real mulai masuk."
                />
                <StatusBadge status={tank.status} />
              </div>
              <ParameterList items={deviceParameters} />
            </section>

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
          <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeading
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
          </section>

          {/* Payload Section */}
          <section
            id="payload"
            className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <SectionHeading
              label="Payload"
              title="Field kompatibel CAT"
              description="Nilai berikut menjadi jembatan dari payload lama ke bentuk data internal yang lebih rapi."
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
                    ? `${formatLiter(tank.rawPayload.volume)} L`
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
          </section>

          {/* Validation Notes Section */}
          <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeading
              label="Validasi"
              title="Hal yang nanti diganti data asli"
              description="Bagian ini menjaga batas data simulator tetap jelas sebelum perangkat asli dan database production disambungkan."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                "Dimensi tangki dari pengukuran lapangan.",
                "Konsumsi solar per jam tiap STO.",
                "Interval kirim data aktual dari perangkat.",
                "Koordinat manual yang sudah disetujui.",
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
          </section>
        </div>
      </div>
    </main>
  );
}
