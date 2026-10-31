import type { Reading } from "../types/monitoring";

// Pembantu bersama view model dashboard dan detail tangki.

export const DEFAULT_NOW = new Date("2026-06-25T07:45:00.000Z");

export function getLatestReading(
  readings: Reading[],
  tankId: string,
): Reading | null {
  const tankReadings = readings
    .filter((reading) => reading.tankId === tankId)
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );

  return tankReadings[0] ?? null;
}

export function formatAgeLabel(receivedAt: string, now: Date): string {
  const receivedTime = new Date(receivedAt).getTime();

  if (!Number.isFinite(receivedTime)) {
    return "waktu tidak valid";
  }

  const ageSec = Math.max(0, Math.floor((now.getTime() - receivedTime) / 1000));

  if (ageSec < 60) {
    return `${ageSec} dtk lalu`;
  }

  const ageMin = Math.floor(ageSec / 60);

  if (ageMin < 60) {
    return `${ageMin} mnt lalu`;
  }

  const ageHour = Math.floor(ageMin / 60);
  const restMin = ageMin % 60;

  return restMin > 0
    ? `${ageHour} jam ${restMin} mnt lalu`
    : `${ageHour} jam lalu`;
}
