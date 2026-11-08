import { STATUS_BADGE_CLASS } from "@/components/ui/status-tone";

type RuntimeLevelParameter = {
  label: string;
  range: string;
  description: string;
  badge: string;
  card: string;
};

export const runtimeLevelParameters: RuntimeLevelParameter[] = [
  {
    label: "Kritis",
    range: "< 13 jam",
    description: "Sisa runtime sudah masuk prioritas tindakan cepat.",
    badge: STATUS_BADGE_CLASS.danger,
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
    badge: STATUS_BADGE_CLASS.warning,
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
    badge: STATUS_BADGE_CLASS.info,
    card: "border-blue-200 bg-blue-50",
  },
  {
    label: "Overstock",
    range: ">= 24 jam",
    description: "Cadangan runtime sangat panjang dibanding batas parameter.",
    badge: STATUS_BADGE_CLASS.success,
    card: "border-emerald-200 bg-emerald-50",
  },
];

const unknownRuntimeLevel: RuntimeLevelParameter = {
  label: "Belum terbaca",
  range: "-",
  description: "Parameter sisa jam menunggu data volume valid.",
  badge: STATUS_BADGE_CLASS.neutral,
  card: "border-zinc-200 bg-zinc-50",
};

export function getRuntimeLevelParameter(
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
