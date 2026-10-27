import {
  STATUS_BADGE_CLASS,
  STATUS_DOT_CLASS,
} from "@/components/ui/status-tone";
import { type TankConfigStatus } from "@/features/monitoring/types/monitoring";
import { formatNumber } from "@/lib/format";
import { type TankStatus } from "./tank-detail-data";

export const statusMeta: Record<
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
    dot: STATUS_DOT_CLASS.success,
    badge: STATUS_BADGE_CLASS.success,
    ring: "ring-emerald-200",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
  },
  warning: {
    label: "Waspada",
    dot: STATUS_DOT_CLASS.warning,
    badge: STATUS_BADGE_CLASS.warning,
    ring: "ring-amber-200",
    text: "text-amber-700",
    soft: "bg-amber-50",
  },
  critical: {
    label: "Kritis",
    dot: "bg-red-600",
    badge: STATUS_BADGE_CLASS.danger,
    ring: "ring-red-200",
    text: "text-red-700",
    soft: "bg-red-50",
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-950",
    badge: STATUS_BADGE_CLASS.neutral,
    ring: "ring-zinc-300",
    text: "text-zinc-700",
    soft: "bg-zinc-100",
  },
};

export function formatMeasurement(value: number | null, unit: string) {
  return value === null ? "-" : `${value} ${unit}`;
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function formatConfigStatusLabel(status: TankConfigStatus) {
  const labels: Record<TankConfigStatus, string> = {
    normal: "normal",
    minor_config_difference: "beda kecil",
    config_mismatch: "mismatch",
    invalid_config: "invalid",
    needs_review: "perlu review",
  };

  return labels[status];
}

export function formatRuntimeHour(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, 2)} jam`;
}
