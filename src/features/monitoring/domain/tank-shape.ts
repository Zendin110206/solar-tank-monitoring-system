import type { TankShape } from "@/features/monitoring/types/monitoring";

// Bentuk tangki dari teks kolom database.

export function toTankShape(value: string): TankShape {
  return value === "rectangular" ? "rectangular" : "horizontal-cylinder";
}
