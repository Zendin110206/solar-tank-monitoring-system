import type { Reading } from "../types/monitoring";

function getReceivedTime(reading: Reading): number {
  const time = Date.parse(reading.receivedAt);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

function getSourcePriority(reading: Reading): number {
  return reading.resolution === "latest" ? 1 : 0;
}

function isFresherReading(candidate: Reading, current: Reading): boolean {
  const candidateTime = getReceivedTime(candidate);
  const currentTime = getReceivedTime(current);

  if (candidateTime !== currentTime) {
    return candidateTime > currentTime;
  }

  const priorityDifference =
    getSourcePriority(candidate) - getSourcePriority(current);

  if (priorityDifference !== 0) {
    return priorityDifference > 0;
  }

  return candidate.id > current.id;
}

export function selectLatestReadingPerTank(readings: Reading[]): Reading[] {
  const latestByTankId = new Map<string, Reading>();

  readings.forEach((reading) => {
    const current = latestByTankId.get(reading.tankId);

    if (!current || isFresherReading(reading, current)) {
      latestByTankId.set(reading.tankId, reading);
    }
  });

  return Array.from(latestByTankId.values()).sort((first, second) => {
    return (
      getReceivedTime(first) - getReceivedTime(second) ||
      first.id.localeCompare(second.id)
    );
  });
}

export function mergeMonitoringReadingsById(
  ...readingGroups: Reading[][]
): Reading[] {
  const readingById = new Map<string, Reading>();

  readingGroups.flat().forEach((reading) => {
    const current = readingById.get(reading.id);

    if (!current || isFresherReading(reading, current)) {
      readingById.set(reading.id, reading);
    }
  });

  return Array.from(readingById.values()).sort((first, second) => {
    return (
      getReceivedTime(first) - getReceivedTime(second) ||
      first.id.localeCompare(second.id)
    );
  });
}
