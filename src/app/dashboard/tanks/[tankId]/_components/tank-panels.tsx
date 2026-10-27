import { Card } from "@/components/ui/card";
import { TankLocationMap } from "@/features/monitoring/components/tank-location-map";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "@/components/ui/section-header";
import {
  getRuntimeLevelParameter,
  runtimeLevelParameters,
} from "./runtime-levels";
import { type ParameterItem, type TankDetail } from "./tank-detail-data";
import {
  formatConfigStatusLabel,
  formatMeasurement,
  formatPercent,
  formatRuntimeHour,
} from "./tank-detail-format";

export function LocationPanel({ tank }: { tank: TankDetail }) {
  return (
    <article className="animate-soft-fade overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          limitDescriptionWidth
          label="Lokasi manual"
          title="Titik STO pada peta manual"
          description="Koordinat ditampilkan sebagai input manual agar tidak bergantung pada modul GPS."
        />
        <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
          {tank.coordinateLabel}
        </span>
      </div>

      <TankLocationMap sites={tank.nearbySites} initialTankId={tank.id} />
    </article>
  );
}

export function ParameterList({ items }: { items: ParameterItem[] }) {
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

function formatSnapshotItem(
  value: string | number | null | undefined,
  suffix = "",
) {
  if (typeof value === "undefined" || value === null || value === "") {
    return "-";
  }

  return typeof value === "number" ? `${formatNumber(value)}${suffix}` : value;
}

export function ConfigReviewPanel({ tank }: { tank: TankDetail }) {
  const review = tank.configReview;
  const isProblem = review.needsReview || review.status === "invalid_config";
  const isMinor = review.status === "minor_config_difference";
  const tone = isProblem
    ? "border-red-200 bg-red-50"
    : isMinor
      ? "border-amber-200 bg-amber-50"
      : "border-emerald-200 bg-emerald-50";
  const badgeTone = isProblem
    ? "bg-red-600 text-white"
    : isMinor
      ? "bg-amber-500 text-white"
      : "bg-emerald-600 text-white";
  const payloadConfig = review.payloadTankConfig;
  const registryConfig = review.registryTankConfig;
  const appliedConfig = review.appliedTankConfig;
  const configCards = [
    {
      label: "Registry",
      shape:
        registryConfig.shape === "rectangular"
          ? "Tangki balok"
          : "Silinder horizontal",
      capacity: formatSnapshotItem(registryConfig.capacityLiter, " L"),
      source: "data resmi aplikasi",
    },
    {
      label: "Payload",
      shape: payloadConfig?.shape
        ? payloadConfig.shape === "rectangular"
          ? "Tangki balok"
          : "Silinder horizontal"
        : "-",
      capacity: formatSnapshotItem(payloadConfig?.capacityLiter, " L"),
      source: "laporan perangkat",
    },
    {
      label: "Dipakai pembacaan",
      shape:
        appliedConfig.shape === "rectangular"
          ? "Tangki balok"
          : "Silinder horizontal",
      capacity: formatSnapshotItem(appliedConfig.capacityLiter, " L"),
      source: "hasil normalisasi",
    },
  ];

  return (
    <section
      className={`mb-5 animate-soft-fade rounded-lg border p-5 shadow-sm ${tone}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          limitDescriptionWidth
          label="Review config"
          title={review.summaryLabel}
          description="Payload perangkat boleh membawa konfigurasi tangki, tetapi tetap dibandingkan dengan registry agar perubahan besar tidak dipercaya diam-diam."
        />
        <div className="flex flex-wrap gap-2">
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeTone}`}
          >
            {formatConfigStatusLabel(review.status)}
          </span>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
            sumber {review.configSource}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {configCards.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-950">
              {item.shape}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{item.capacity}</p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {item.source}
            </p>
          </div>
        ))}
      </div>

      {review.issues.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {review.issues.slice(0, 4).map((issue) => (
            <div
              key={`${issue.field}-${issue.message}`}
              className="rounded-lg border border-white/70 bg-white/80 p-4 text-sm leading-6 text-zinc-700 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-950">{issue.label}</p>
                  <p className="mt-1">{issue.message}</p>
                </div>
                <span className="w-fit rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white">
                  {issue.severity}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Data resmi: {issue.registryValue} | Data perangkat:{" "}
                {issue.payloadValue}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-white/70 bg-white/80 p-4 text-sm leading-6 text-zinc-600 shadow-sm">
          Tidak ada konflik konfigurasi besar yang terdeteksi pada pembacaan
          terbaru.
        </p>
      )}
    </section>
  );
}

export function RuntimeParameterPanel({ tank }: { tank: TankDetail }) {
  const activeParameter = getRuntimeLevelParameter(
    tank.hasReading ? tank.runtimeHour : null,
  );

  return (
    <Card className="animate-soft-fade">
      <SectionHeader
        limitDescriptionWidth
        label="Sisa jam"
        title="Level parameter runtime"
        description="Kategori ini membaca sisa runtime genset agar operator tahu posisi tangki terhadap batas operasional."
      />

      <div className={`mt-5 rounded-lg border p-4 ${activeParameter.card}`}>
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
    </Card>
  );
}

export function TankConfigurationPanel({ tank }: { tank: TankDetail }) {
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
    ["Status config", tank.configReview.summaryLabel],
    ["Sumber config", tank.configReview.configSource],
    ["Tipe visual", tank.shapeLabel],
    ["Kapasitas", `${formatNumber(tank.capacityLiter)} L`],
    ...dimensionRows,
    ["Tinggi sensor", formatMeasurement(tank.sensorMountHeightCm, "cm")],
    ["Konsumsi per jam", `${tank.consumptionLiterPerHour} L/jam`],
    ["Low level", formatPercent(tank.lowLevelPercent)],
    ["Critical level", formatPercent(tank.criticalLevelPercent)],
    ["Interval kirim", `${tank.expectedIntervalMin} menit`],
  ];

  return (
    <Card id="konfigurasi" className="animate-soft-fade">
      <SectionHeader
        limitDescriptionWidth
        label="Konfigurasi"
        title="Spesifikasi tangki dan perangkat"
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
    </Card>
  );
}
