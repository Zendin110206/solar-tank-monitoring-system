import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
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
  ShieldCheck,
  Wifi,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Detail Tangki Solar | SolarTank",
  description:
    "Halaman detail frontend untuk membaca kondisi satu tangki solar, visual isi tangki, parameter perangkat, dan riwayat pembacaan.",
};

type TankStatus = "online" | "warning" | "critical" | "offline";

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

type NearbySite = {
  code: string;
  name: string;
  status: TankStatus;
  left: string;
  top: string;
  runtimeHour: number;
};

type TankDetail = {
  id: string;
  siteCode: string;
  siteName: string;
  areaLabel: string;
  tankName: string;
  status: TankStatus;
  statusNote: string;
  fillPercent: number;
  volumeLiter: number;
  capacityLiter: number;
  runtimeHour: number;
  consumptionLiterPerHour: number;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  diameterCm: number;
  lengthCm: number;
  sensorMountHeightCm: number;
  deviceId: string;
  deviceLabel: string;
  expectedIntervalMin: number;
  lastUpdateLabel: string;
  measuredAtLabel: string;
  receivedAtLabel: string;
  rssiDbm: number;
  batteryVolt: number;
  coordinateLabel: string;
  markerLeft: string;
  markerTop: string;
  rawPayload: {
    distance: number;
    H_cm: number;
    volume: number;
    percent: number;
    wifi_rssi: number;
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

const tanks: TankDetail[] = [
  {
    id: "tank-tph-main",
    siteCode: "TPH",
    siteName: "STO TPH",
    areaLabel: "Area Pasuruan - data dummy",
    tankName: "Tangki Utama",
    status: "online",
    statusNote: "Pembacaan terbaru masih segar dan level solar berada di zona aman.",
    fillPercent: 78,
    volumeLiter: 3900,
    capacityLiter: 5000,
    runtimeHour: 156,
    consumptionLiterPerHour: 25,
    sensorDistanceCm: 35,
    fuelHeightCm: 115,
    diameterCm: 150,
    lengthCm: 283,
    sensorMountHeightCm: 150,
    deviceId: "demo-tph-01",
    deviceLabel: "NodeMCU ultrasonic dummy",
    expectedIntervalMin: 5,
    lastUpdateLabel: "2 menit lalu",
    measuredAtLabel: "25 Jun 2026, 14:43 WIB",
    receivedAtLabel: "25 Jun 2026, 14:43:08 WIB",
    rssiDbm: -61,
    batteryVolt: 3.85,
    coordinateLabel: "-7.64, 112.90 (dummy)",
    markerLeft: "58%",
    markerTop: "44%",
    rawPayload: {
      distance: 35,
      H_cm: 115,
      volume: 3900,
      percent: 78,
      wifi_rssi: -61,
    },
    readings: [
      { time: "06:00", percent: 84, volumeLiter: 4200, distanceCm: 24 },
      { time: "08:00", percent: 83, volumeLiter: 4150, distanceCm: 26 },
      { time: "10:00", percent: 82, volumeLiter: 4100, distanceCm: 28 },
      { time: "12:00", percent: 80, volumeLiter: 4000, distanceCm: 31 },
      { time: "14:00", percent: 78, volumeLiter: 3900, distanceCm: 35 },
      { time: "16:00", percent: 77, volumeLiter: 3850, distanceCm: 37 },
      { time: "18:00", percent: 75, volumeLiter: 3750, distanceCm: 41 },
      { time: "20:00", percent: 74, volumeLiter: 3700, distanceCm: 43 },
    ],
    nearbySites: [
      {
        code: "TPH",
        name: "STO TPH",
        status: "online",
        left: "58%",
        top: "44%",
        runtimeHour: 156,
      },
      {
        code: "NJA",
        name: "STO NJA",
        status: "warning",
        left: "34%",
        top: "38%",
        runtimeHour: 15,
      },
      {
        code: "JTO",
        name: "STO JTO",
        status: "critical",
        left: "45%",
        top: "66%",
        runtimeHour: 7,
      },
      {
        code: "SKP",
        name: "STO SKP",
        status: "offline",
        left: "75%",
        top: "58%",
        runtimeHour: 31,
      },
    ],
  },
  {
    id: "tank-nja-main",
    siteCode: "NJA",
    siteName: "STO NJA",
    areaLabel: "Area Pasuruan - data dummy",
    tankName: "Tangki Utama",
    status: "warning",
    statusNote: "Runtime masuk zona waspada sehingga perlu dipantau lebih sering.",
    fillPercent: 42,
    volumeLiter: 2100,
    capacityLiter: 5000,
    runtimeHour: 15,
    consumptionLiterPerHour: 140,
    sensorDistanceCm: 88,
    fuelHeightCm: 62,
    diameterCm: 150,
    lengthCm: 283,
    sensorMountHeightCm: 150,
    deviceId: "demo-nja-01",
    deviceLabel: "NodeMCU ultrasonic dummy",
    expectedIntervalMin: 5,
    lastUpdateLabel: "5 menit lalu",
    measuredAtLabel: "25 Jun 2026, 14:40 WIB",
    receivedAtLabel: "25 Jun 2026, 14:40:11 WIB",
    rssiDbm: -69,
    batteryVolt: 3.76,
    coordinateLabel: "-7.67, 112.88 (dummy)",
    markerLeft: "34%",
    markerTop: "38%",
    rawPayload: {
      distance: 88,
      H_cm: 62,
      volume: 2100,
      percent: 42,
      wifi_rssi: -69,
    },
    readings: [
      { time: "06:00", percent: 50, volumeLiter: 2500, distanceCm: 75 },
      { time: "08:00", percent: 49, volumeLiter: 2450, distanceCm: 77 },
      { time: "10:00", percent: 47, volumeLiter: 2350, distanceCm: 80 },
      { time: "12:00", percent: 45, volumeLiter: 2250, distanceCm: 83 },
      { time: "14:00", percent: 42, volumeLiter: 2100, distanceCm: 88 },
    ],
    nearbySites: [],
  },
  {
    id: "tank-jto-main",
    siteCode: "JTO",
    siteName: "STO JTO",
    areaLabel: "Area Pasuruan - data dummy",
    tankName: "Tangki Utama",
    status: "critical",
    statusNote: "Estimasi runtime rendah dan harus masuk daftar tindak lanjut utama.",
    fillPercent: 19,
    volumeLiter: 950,
    capacityLiter: 5000,
    runtimeHour: 7,
    consumptionLiterPerHour: 135,
    sensorDistanceCm: 122,
    fuelHeightCm: 28,
    diameterCm: 150,
    lengthCm: 283,
    sensorMountHeightCm: 150,
    deviceId: "demo-jto-01",
    deviceLabel: "NodeMCU ultrasonic dummy",
    expectedIntervalMin: 5,
    lastUpdateLabel: "1 menit lalu",
    measuredAtLabel: "25 Jun 2026, 14:44 WIB",
    receivedAtLabel: "25 Jun 2026, 14:44:09 WIB",
    rssiDbm: -58,
    batteryVolt: 3.81,
    coordinateLabel: "-7.69, 112.92 (dummy)",
    markerLeft: "45%",
    markerTop: "66%",
    rawPayload: {
      distance: 122,
      H_cm: 28,
      volume: 950,
      percent: 19,
      wifi_rssi: -58,
    },
    readings: [
      { time: "06:00", percent: 29, volumeLiter: 1450, distanceCm: 106 },
      { time: "08:00", percent: 27, volumeLiter: 1350, distanceCm: 109 },
      { time: "10:00", percent: 24, volumeLiter: 1200, distanceCm: 114 },
      { time: "12:00", percent: 21, volumeLiter: 1050, distanceCm: 119 },
      { time: "14:00", percent: 19, volumeLiter: 950, distanceCm: 122 },
    ],
    nearbySites: [],
  },
];

const selectedDefaultNearbySites = tanks[0].nearbySites;

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getTank(tankId: string) {
  return tanks.find((tank) => tank.id === tankId);
}

export function generateStaticParams() {
  return tanks.map((tank) => ({
    tankId: tank.id,
  }));
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

function TankVisual({ tank }: { tank: TankDetail }) {
  const fillStyle = {
    width: `${tank.fillPercent}%`,
  } satisfies CSSProperties;
  const sensorLineStyle = {
    left: `${Math.min(Math.max(tank.fillPercent, 8), 92)}%`,
  } satisfies CSSProperties;

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          label="Visual tangki"
          title="Silinder horizontal"
          description="Model tampilan ini mengikuti skenario tangki tidur. Angka masih dummy dan nanti diganti dari konfigurasi lapangan."
        />
        <StatusBadge status={tank.status} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[22rem] rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-5">
          <div className="absolute left-6 top-5 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200">
            <Radio className="size-4 text-red-600" aria-hidden="true" />
            Sensor ultrasonic
          </div>

          <div className="absolute right-6 top-5 rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">
            Isi {tank.fillPercent}%
          </div>

          <div className="absolute inset-x-6 bottom-16">
            <div className="relative h-44 overflow-hidden rounded-full border border-zinc-300 bg-white shadow-inner">
              <div
                className="absolute inset-4 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[999px] bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 shadow-[inset_-18px_0_24px_rgba(255,255,255,0.28)]"
                  style={fillStyle}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10" />
                <div className="absolute left-4 right-4 top-5 h-7 rounded-full bg-white/25 blur-sm" />
              </div>

              <div className="absolute inset-y-0 left-6 w-8 rounded-full border border-white/80 bg-white/30" />
              <div className="absolute inset-y-0 right-6 w-8 rounded-full border border-zinc-300 bg-white/30" />
              <div className="absolute inset-x-12 top-1/2 border-t border-dashed border-white/70" />
              <div
                className="absolute bottom-4 top-4 border-l-2 border-dashed border-red-500"
                style={sensorLineStyle}
              />
              <div
                className="absolute -top-1 size-4 -translate-x-1/2 rounded-full bg-red-600 ring-4 ring-red-100"
                style={sensorLineStyle}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-medium text-zinc-500">
              <span>0%</span>
              <span className="text-center">kapasitas {formatLiter(tank.capacityLiter)} L</span>
              <span className="text-right">100%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {[
            {
              label: "Jarak sensor",
              value: `${tank.sensorDistanceCm} cm`,
              note: "distance dari payload",
              icon: Ruler,
            },
            {
              label: "Tinggi solar",
              value: `${tank.fuelHeightCm} cm`,
              note: "raw.H_cm setelah normalisasi",
              icon: Droplets,
            },
            {
              label: "Panjang tangki",
              value: `${tank.lengthCm} cm`,
              note: "konfigurasi dummy",
              icon: Settings,
            },
            {
              label: "Diameter tangki",
              value: `${tank.diameterCm} cm`,
              note: "konfigurasi dummy",
              icon: Gauge,
            },
          ].map((item) => {
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
      </div>
    </div>
  );
}

function TrendChart({ readings }: { readings: ReadingPoint[] }) {
  const maxPercent = 100;

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex h-64 items-end gap-3">
        {readings.map((reading) => {
          const height = Math.max((reading.percent / maxPercent) * 100, 8);

          return (
            <div key={reading.time} className="flex h-full flex-1 flex-col justify-end gap-2">
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
      <button
        type="button"
        className={`grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg shadow-zinc-400/20 ring-4 transition duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${meta.ring}`}
        aria-label={`${site.name}, ${meta.label}`}
      >
        <span className={`size-3.5 rounded-full ${meta.dot}`} />
      </button>
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
  const sites =
    tank.nearbySites.length > 0 ? tank.nearbySites : selectedDefaultNearbySites;

  return (
    <article className="animate-soft-fade overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          label="Lokasi manual"
          title="Titik STO pada peta dummy"
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
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 p-1 ring-8 ring-red-100"
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
                <p className="text-xs font-medium text-zinc-400">{item.label}</p>
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
          {tank.readings.map((reading) => (
            <tr key={reading.time} className="bg-zinc-50">
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
          ))}
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
  const tank = getTank(tankId);

  if (!tank) {
    notFound();
  }

  const status = statusMeta[tank.status];
  const metrics = [
    {
      label: "Volume saat ini",
      value: `${formatLiter(tank.volumeLiter)} L`,
      note: `${tank.fillPercent}% dari kapasitas dummy ${formatLiter(tank.capacityLiter)} L`,
      icon: Fuel,
      tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    },
    {
      label: "Estimasi runtime",
      value: `${tank.runtimeHour} jam`,
      note: `berdasarkan konsumsi ${tank.consumptionLiterPerHour} L/jam`,
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
      value: `${tank.rssiDbm} dBm`,
      note: "nilai dummy dari payload perangkat",
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
      value: `${tank.batteryVolt} V`,
      note: "dummy untuk menyiapkan monitoring health perangkat",
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
      value: `${tank.sensorDistanceCm} cm`,
      detail: "jarak dari sensor ke permukaan solar",
    },
    {
      label: "Tinggi solar dihitung",
      value: `${tank.fuelHeightCm} cm`,
      detail: "nilai ter-normalisasi dari raw.H_cm",
    },
    {
      label: "Volume dan persen",
      value: `${formatLiter(tank.volumeLiter)} L / ${tank.fillPercent}%`,
      detail: "angka siap dipakai UI dan status",
    },
    {
      label: "Runtime operasional",
      value: `${tank.runtimeHour} jam`,
      detail: "perkiraan durasi genset dari konsumsi per jam",
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
            <a href="#payload" className="transition hover:text-red-600">
              Payload
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-zinc-500 md:flex">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
              <span>Frontend dummy</span>
            </div>
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
                  data dummy
                </span>
              </div>

              <h1 className="mt-3 max-w-4xl break-words text-[1.85rem] font-semibold leading-[1.08] tracking-normal text-zinc-950 sm:text-4xl lg:text-5xl">
                {tank.tankName} {tank.siteName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                Detail ini menampilkan isi tangki, parameter sensor, estimasi
                runtime, riwayat 24 jam, dan posisi STO berbasis koordinat manual.
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
                <p className="mt-1 text-lg font-semibold">{tank.lastUpdateLabel}</p>
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
                  description="Grafik ini masih dari data dummy, tetapi strukturnya mengikuti kebutuhan endpoint history nanti."
                />
                <span className="block max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:w-fit">
                  /history/{tank.deviceId}?limit=1000
                </span>
              </div>
              <TrendChart readings={tank.readings} />
              <ReadingTable tank={tank} />
            </section>

            {/* Location Section */}
            <section id="lokasi">
              <LocationPanel tank={tank} />
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            {/* Device Health Section */}
            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <SectionHeading
                  label="Perangkat"
                  title="Status sensor"
                  description="Informasi ini disiapkan untuk health check perangkat saat API sudah aktif."
                />
                <StatusBadge status={tank.status} />
              </div>
              <ParameterList items={deviceParameters} />
            </section>

            {/* Data Flow Section */}
            <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionHeading
                label="Alur baca"
                title="Dari sensor ke keputusan"
                description="Urutan ini menjaga dashboard tidak salah memahami data mentah perangkat."
              />

              <div className="mt-6 space-y-4">
                {dataFlow.map((item, index) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="grid size-9 place-items-center rounded-full bg-red-50 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                        {index + 1}
                      </span>
                      {index < dataFlow.length - 1 ? (
                        <span className="mt-2 h-full min-h-10 border-l border-zinc-200" />
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

              <div className="mt-6 space-y-3">
                {[
                  ["distance", `${tank.rawPayload.distance} cm`],
                  ["raw.H_cm", `${tank.rawPayload.H_cm} cm`],
                  ["raw.volume", `${formatLiter(tank.rawPayload.volume)} L`],
                  ["raw.percent", `${tank.rawPayload.percent}%`],
                  ["raw.wifi_rssi", `${tank.rawPayload.wifi_rssi} dBm`],
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
                description="Bagian ini menjaga dummy tetap jelas sebelum perangkat dan backend disambungkan."
              />

              <div className="mt-6 space-y-3">
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
          </aside>
        </div>
      </div>
    </main>
  );
}
