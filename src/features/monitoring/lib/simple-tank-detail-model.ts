import type {
  DeviceStatus,
  Reading,
  TankShape,
} from "@/features/monitoring/types/monitoring";
import type {
  TankDetailStatus,
  TankDetailView,
  TankReadingPoint,
} from "./tank-detail-view-model";

export const SIMPLE_TANK_DETAIL_CHART_INTERVAL_MINUTES = 5;
export const SIMPLE_TANK_DETAIL_CHART_MAX_POINTS = 48;

export type SimpleTankChartRangeKey = "day" | "week" | "month";

export type SimpleTankChartRange = {
  key: SimpleTankChartRangeKey;
  label: string;
  bucketLabel: string;
  bucketMinutes: number;
  days: number;
};

export type SimpleTankTrendTick = {
  label: string;
  xRatio: number;
};

export type SimpleTankDetailChartPoint = {
  receivedAt: string;
  timeLabel: string;
  fullTimeLabel: string;
  volumeLiter: number;
};

export type SimpleTankTrendPoint = SimpleTankDetailChartPoint & {
  bucketStart: string;
  bucketEnd: string;
  sampleCount: number;
  xRatio: number;
};

export type SimpleTankTrendModel = {
  range: SimpleTankChartRange;
  domainStart: string;
  domainEnd: string;
  totalSlots: number;
  points: SimpleTankTrendPoint[];
  xTicks: SimpleTankTrendTick[];
};

export type SimpleTankTrendByRange = Record<
  SimpleTankChartRangeKey,
  SimpleTankTrendModel
>;

export type SimpleTankDetail = {
  id: string;
  siteCode: string;
  siteName: string;
  areaLabel: string;
  tankName: string;
  hasReading: boolean;
  status: TankDetailStatus;
  statusLabel: string;
  deviceStatus: DeviceStatus;
  deviceStatusLabel: string;
  volumeLiter: number;
  capacityLiter: number;
  fillPercent: number;
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
  deviceCode: string;
  deviceLabel: string;
  lastUpdateLabel: string;
  measuredAtLabel: string;
  receivedAtLabel: string;
  chartPoints: SimpleTankDetailChartPoint[];
  chartTrends: SimpleTankTrendByRange;
};

type ChartSamplingOptions = {
  minIntervalMinutes?: number;
  maxPoints?: number;
};

export const SIMPLE_TANK_CHART_RANGES: SimpleTankChartRange[] = [
  {
    key: "day",
    label: "1 hari",
    bucketLabel: "Bucket 5 menit",
    bucketMinutes: 5,
    days: 1,
  },
  {
    key: "week",
    label: "7 hari",
    bucketLabel: "Rata-rata per jam",
    bucketMinutes: 60,
    days: 7,
  },
  {
    key: "month",
    label: "30 hari",
    bucketLabel: "Rata-rata per tanggal",
    bucketMinutes: 60 * 24,
    days: 30,
  },
];

const deviceStatusLabels: Record<DeviceStatus, string> = {
  online: "Online",
  delayed: "Terlambat",
  offline: "Offline",
  unknown: "Belum terbaca",
};

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatClockLabel(date: Date) {
  return `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullTimeLabel(value: string) {
  const time = parseTime(value);

  if (time === null) {
    return "-";
  }

  const date = new Date(time);

  return `${formatDateLabel(date)}, ${formatClockLabel(date)}`;
}

function startOfLocalDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);

  return date;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getChartRange(rangeKey: SimpleTankChartRangeKey) {
  return (
    SIMPLE_TANK_CHART_RANGES.find((range) => range.key === rangeKey) ??
    SIMPLE_TANK_CHART_RANGES[0]
  );
}

function formatTrendPointLabel(date: Date, rangeKey: SimpleTankChartRangeKey) {
  if (rangeKey === "month") {
    return formatDateLabel(date);
  }

  return formatClockLabel(date);
}

function buildTrendTicks({
  domainStart,
  domainEnd,
  rangeKey,
}: {
  domainStart: Date;
  domainEnd: Date;
  rangeKey: SimpleTankChartRangeKey;
}): SimpleTankTrendTick[] {
  const domainDuration = domainEnd.getTime() - domainStart.getTime();

  if (domainDuration <= 0) {
    return [];
  }

  if (rangeKey === "day") {
    return [
      { label: "00:00", xRatio: 0 },
      { label: "06:00", xRatio: 0.25 },
      { label: "12:00", xRatio: 0.5 },
      { label: "18:00", xRatio: 0.75 },
      { label: "23:59", xRatio: 1 },
    ];
  }

  if (rangeKey === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const tickDate = addDays(domainStart, index);

      return {
        label: formatDateLabel(tickDate),
        xRatio: (tickDate.getTime() - domainStart.getTime()) / domainDuration,
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const tickDate =
      index === 6 ? addDays(domainStart, 29) : addDays(domainStart, index * 5);

    return {
      label: formatDateLabel(tickDate),
      xRatio: (tickDate.getTime() - domainStart.getTime()) / domainDuration,
    };
  });
}

type ChartPointInput = Reading | TankReadingPoint | SimpleTankDetailChartPoint;

function toSimpleChartPoint(reading: ChartPointInput): SimpleTankDetailChartPoint | null {
  if ("fullTimeLabel" in reading) {
    return reading;
  }

  const time = parseTime(reading.receivedAt);

  if (time === null) {
    return null;
  }

  return {
    receivedAt: reading.receivedAt,
    timeLabel:
      "timeLabel" in reading
        ? reading.timeLabel
        : formatClockLabel(new Date(reading.receivedAt)),
    fullTimeLabel: formatFullTimeLabel(reading.receivedAt),
    volumeLiter: reading.volumeLiter,
  };
}

export function sampleSimpleTankDetailChartPoints(
  readings: ChartPointInput[],
  options: ChartSamplingOptions = {},
): SimpleTankDetailChartPoint[] {
  const minIntervalMs =
    (options.minIntervalMinutes ??
      SIMPLE_TANK_DETAIL_CHART_INTERVAL_MINUTES) *
    60 *
    1000;
  const maxPoints = options.maxPoints ?? SIMPLE_TANK_DETAIL_CHART_MAX_POINTS;
  const sortedPoints = readings
    .map(toSimpleChartPoint)
    .filter((point): point is SimpleTankDetailChartPoint => point !== null)
    .sort((first, second) => {
      return Date.parse(first.receivedAt) - Date.parse(second.receivedAt);
    });

  const sampledPoints: SimpleTankDetailChartPoint[] = [];
  let lastIncludedTime = Number.NEGATIVE_INFINITY;

  sortedPoints.forEach((point, index) => {
    const pointTime = Date.parse(point.receivedAt);
    const isLatestPoint = index === sortedPoints.length - 1;
    const isFarEnough = pointTime - lastIncludedTime >= minIntervalMs;

    if (sampledPoints.length === 0 || isFarEnough) {
      sampledPoints.push(point);
      lastIncludedTime = pointTime;
      return;
    }

    if (isLatestPoint) {
      sampledPoints[sampledPoints.length - 1] = point;
      lastIncludedTime = pointTime;
    }
  });

  if (sampledPoints.length <= maxPoints) {
    return sampledPoints;
  }

  return sampledPoints.slice(-maxPoints);
}

export function buildSimpleTankTrend(
  points: SimpleTankDetailChartPoint[],
  rangeKey: SimpleTankChartRangeKey,
): SimpleTankTrendModel {
  const range = getChartRange(rangeKey);
  const sortedPoints = points
    .filter((point) => parseTime(point.receivedAt) !== null)
    .sort((first, second) => {
      return Date.parse(first.receivedAt) - Date.parse(second.receivedAt);
    });
  const latestTime = sortedPoints
    .map((point) => parseTime(point.receivedAt))
    .filter((time): time is number => time !== null)
    .at(-1);

  if (latestTime === undefined) {
    const now = new Date();
    const domainStart = startOfLocalDay(now.getTime());
    const domainEnd = addDays(domainStart, range.days);

    return {
      range,
      domainStart: domainStart.toISOString(),
      domainEnd: domainEnd.toISOString(),
      totalSlots: Math.ceil(
        (domainEnd.getTime() - domainStart.getTime()) /
          (range.bucketMinutes * 60 * 1000),
      ),
      points: [],
      xTicks: buildTrendTicks({ domainStart, domainEnd, rangeKey }),
    };
  }

  const latestDayStart = startOfLocalDay(latestTime);
  const domainStart = addDays(latestDayStart, -(range.days - 1));
  const domainEnd = addDays(latestDayStart, 1);
  const domainStartTime = domainStart.getTime();
  const domainEndTime = domainEnd.getTime();
  const domainDuration = domainEndTime - domainStartTime;
  const bucketMs = range.bucketMinutes * 60 * 1000;
  const totalSlots = Math.ceil(domainDuration / bucketMs);
  const buckets = new Map<
    number,
    {
      totalVolume: number;
      sampleCount: number;
    }
  >();

  sortedPoints.forEach((point) => {
    const pointTime = parseTime(point.receivedAt);

    if (
      pointTime === null ||
      pointTime < domainStartTime ||
      pointTime >= domainEndTime
    ) {
      return;
    }

    const bucketIndex = Math.floor((pointTime - domainStartTime) / bucketMs);
    const bucket = buckets.get(bucketIndex) ?? {
      totalVolume: 0,
      sampleCount: 0,
    };

    bucket.totalVolume += point.volumeLiter;
    bucket.sampleCount += 1;
    buckets.set(bucketIndex, bucket);
  });

  const trendPoints = Array.from(buckets.entries())
    .sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex)
    .map(([bucketIndex, bucket]): SimpleTankTrendPoint => {
      const bucketStart = new Date(domainStartTime + bucketIndex * bucketMs);
      const bucketEnd = addMinutes(bucketStart, range.bucketMinutes);
      const bucketCenterTime = bucketStart.getTime() + bucketMs / 2;
      const volumeLiter = bucket.totalVolume / bucket.sampleCount;

      return {
        bucketStart: bucketStart.toISOString(),
        bucketEnd: bucketEnd.toISOString(),
        fullTimeLabel: formatFullTimeLabel(bucketStart.toISOString()),
        receivedAt: bucketStart.toISOString(),
        sampleCount: bucket.sampleCount,
        timeLabel: formatTrendPointLabel(bucketStart, range.key),
        volumeLiter,
        xRatio:
          domainDuration > 0
            ? (bucketCenterTime - domainStartTime) / domainDuration
            : 0,
      };
    });

  return {
    range,
    domainStart: domainStart.toISOString(),
    domainEnd: domainEnd.toISOString(),
    totalSlots,
    points: trendPoints,
    xTicks: buildTrendTicks({ domainStart, domainEnd, rangeKey }),
  };
}

export function buildSimpleTankTrends(
  points: SimpleTankDetailChartPoint[],
): SimpleTankTrendByRange {
  return SIMPLE_TANK_CHART_RANGES.reduce((trendByRange, range) => {
    return {
      ...trendByRange,
      [range.key]: buildSimpleTankTrend(points, range.key),
    };
  }, {} as SimpleTankTrendByRange);
}

export function buildSimpleTankDetail(
  view: TankDetailView,
  historyReadings: Reading[] = [],
): SimpleTankDetail {
  const chartReadings =
    historyReadings.length > 0
      ? historyReadings.filter((reading) => reading.tankId === view.id)
      : view.readings;

  const chartPoints = chartReadings
    .map(toSimpleChartPoint)
    .filter((point): point is SimpleTankDetailChartPoint => point !== null)
    .sort((first, second) => {
      return Date.parse(first.receivedAt) - Date.parse(second.receivedAt);
    });

  return {
    id: view.id,
    siteCode: view.siteCode,
    siteName: view.siteName,
    areaLabel: view.areaLabel,
    tankName: view.tankName,
    hasReading: view.hasReading,
    status: view.status,
    statusLabel: view.statusLabel,
    deviceStatus: view.statuses.deviceStatus,
    deviceStatusLabel: deviceStatusLabels[view.statuses.deviceStatus],
    volumeLiter: view.volumeLiter,
    capacityLiter: view.capacityLiter,
    fillPercent: view.fillPercent,
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
    deviceCode: view.deviceCode,
    deviceLabel: view.deviceLabel,
    lastUpdateLabel: view.lastUpdateLabel,
    measuredAtLabel: view.measuredAtLabel,
    receivedAtLabel: view.receivedAtLabel,
    chartPoints,
    chartTrends: buildSimpleTankTrends(chartPoints),
  };
}
