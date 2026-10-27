import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  TankHorizontalCylinderScene3D,
  TankRectangularScene3D,
} from "@/features/monitoring/components/tank-rectangular-scene-3d";
import { formatNumber } from "@/lib/format";
import {
  Activity,
  AlertTriangle,
  Droplets,
  Fuel,
  Gauge,
  Radio,
  Ruler,
  Settings,
  Zap,
} from "lucide-react";
import { type ParameterItem, type TankDetail } from "./tank-detail-data";
import { formatMeasurement, formatPercent } from "./tank-detail-format";
import { StatusBadge } from "./tank-detail-ui";

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

export function TankVisual({ tank }: { tank: TankDetail }) {
  const isRectangular = tank.shape === "rectangular";
  const fillPercent = tank.hasReading ? clampPercent(tank.fillPercent) : 0;
  const visualDescription = isRectangular
    ? "Model tampilan mengikuti tangki balok/persegi panjang. Sensor berada di atas, sehingga perubahan level dibaca secara vertikal."
    : "Model tampilan mengikuti tangki silinder horizontal. Sensor berada di atas, sehingga permukaan bahan bakar naik-turun secara vertikal.";
  const dimensionItems: ParameterItem[] = [
    {
      label: "Tinggi ruang kosong",
      value: tank.hasReading ? `${tank.sensorDistanceCm} cm` : "-",
      note: tank.hasReading
        ? "ruang kosong dari atas tangki ke permukaan cairan"
        : "menunggu data perangkat",
      icon: Ruler,
    },
    {
      label: "Tinggi bahan bakar",
      value: tank.hasReading ? `${tank.fuelHeightCm} cm` : "-",
      note: tank.hasReading
        ? "raw.H_cm setelah normalisasi"
        : "menunggu pembacaan sensor",
      icon: Droplets,
    },
    {
      label: "Kapasitas tangki",
      value: `${formatNumber(tank.capacityLiter)} L`,
      note: "kapasitas konfigurasi perangkat",
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
    <Card as="div" className="relative overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          limitDescriptionWidth
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

          <div className="relative mt-5 h-64 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm sm:h-72">
            {isRectangular ? (
              <TankRectangularScene3D
                fillPercent={fillPercent}
                lengthCm={tank.lengthCm}
                widthCm={tank.widthCm}
                heightCm={tank.heightCm}
                sensorDistanceCm={tank.sensorDistanceCm}
                fuelHeightCm={tank.fuelHeightCm}
              />
            ) : (
              <TankHorizontalCylinderScene3D
                fillPercent={fillPercent}
                lengthCm={tank.lengthCm}
                diameterCm={tank.diameterCm}
                sensorDistanceCm={tank.sensorDistanceCm}
                fuelHeightCm={tank.fuelHeightCm}
              />
            )}
          </div>

          <div className="mt-1 grid grid-cols-3 gap-2 text-xs font-medium text-zinc-500">
            <span>0%</span>
            <span className="text-center">
              kapasitas {formatNumber(tank.capacityLiter)} L
            </span>
            <span className="text-right">100%</span>
          </div>

          <div className="mt-4 rounded-lg border border-cyan-100 bg-white p-3 text-xs leading-5 text-zinc-500">
            Garis merah menunjukkan tinggi ruang kosong dari titik sensor ke
            permukaan bahan bakar. Area biru mengikuti tinggi bahan bakar secara
            vertikal, bukan kiri ke kanan.
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
    </Card>
  );
}
