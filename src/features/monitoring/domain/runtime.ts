import { roundTo } from "./number";

export function calculateRuntimeHours(
  volumeLiter: number,
  consumptionLiterPerHour: number,
): number | null {
  if (consumptionLiterPerHour <= 0) {
    return null;
  }

  return roundTo(Math.max(0, volumeLiter) / consumptionLiterPerHour, 2);
}
