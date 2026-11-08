import { type SimpleTankTrendByRange } from "@/features/monitoring/domain/simple-tank-detail-model";
import {
  type NearbyTankSite,
  type TankDetailStatus,
  type TankDetailView,
  type TankReadingPoint,
} from "@/features/monitoring/domain/tank-detail-view-model";
import {
  type ReadingQuality,
  type TankConfigReview,
  type TankShape,
} from "@/features/monitoring/types/monitoring";
import { type LucideIcon } from "lucide-react";

export type TankStatus = TankDetailStatus;

type ReadingPoint = {
  time: string;
  percent: number;
  volumeLiter: number;
  distanceCm: number;
};

export type TimelineItem = {
  label: string;
  value: string;
  detail: string;
};

export type ParameterItem = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
};

type NearbySite = {
  tankId: string;
  code: string;
  name: string;
  status: TankStatus;
  left: string;
  top: string;
  runtimeHour: number;
  fillPercent: number;
  updateLabel: string;
};

export type TankDetail = {
  id: string;
  hasReading: boolean;
  siteCode: string;
  siteName: string;
  areaLabel: string;
  regionalLabel?: string;
  wilayahLabel?: string;
  tankName: string;
  status: TankStatus;
  statusNote: string;
  fillPercent: number;
  volumeLiter: number;
  capacityLiter: number;
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
  sensorMountHeightCm: number;
  lowLevelPercent: number;
  criticalLevelPercent: number;
  deviceId: string;
  deviceLabel: string;
  expectedIntervalMin: number;
  lastUpdateLabel: string;
  measuredAtLabel: string;
  receivedAtLabel: string;
  rssiDbm: number | null;
  batteryVolt: number | null;
  coordinateLabel: string;
  markerLeft: string;
  markerTop: string;
  rawPayload: {
    distance: number;
    H_cm: number;
    volume: number;
    percent: number;
    wifi_rssi: number | null;
  };
  dataSources: ReadingQuality;
  configReview: TankConfigReview;
  readings: ReadingPoint[];
  chartTrends: SimpleTankTrendByRange;
  nearbySites: NearbySite[];
};

function toReadingPoint(reading: TankReadingPoint): ReadingPoint {
  return {
    time: reading.timeLabel,
    percent: reading.fillPercent,
    volumeLiter: reading.volumeLiter,
    distanceCm: reading.sensorDistanceCm,
  };
}

function toNearbySite(site: NearbyTankSite): NearbySite {
  return {
    tankId: site.tankId,
    code: site.code,
    name: site.name,
    status: site.status,
    left: site.left,
    top: site.top,
    runtimeHour: site.runtimeHour,
    fillPercent: site.fillPercent,
    updateLabel: site.updateLabel,
  };
}

export function toTankDetail(
  view: TankDetailView,
  chartTrends: SimpleTankTrendByRange,
): TankDetail {
  return {
    id: view.id,
    hasReading: view.hasReading,
    siteCode: view.siteCode,
    siteName: view.siteName,
    areaLabel: view.areaLabel,
    regionalLabel: view.regionalLabel,
    wilayahLabel: view.wilayahLabel,
    tankName: view.tankName,
    status: view.status,
    statusNote: view.statusNote,
    fillPercent: view.fillPercent,
    volumeLiter: view.volumeLiter,
    capacityLiter: view.capacityLiter,
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
    sensorMountHeightCm: view.sensorMountHeightCm,
    lowLevelPercent: view.lowLevelPercent,
    criticalLevelPercent: view.criticalLevelPercent,
    deviceId: view.deviceCode,
    deviceLabel: view.deviceLabel,
    expectedIntervalMin: view.expectedIntervalMin,
    lastUpdateLabel: view.lastUpdateLabel,
    measuredAtLabel: view.measuredAtLabel,
    receivedAtLabel: view.receivedAtLabel,
    rssiDbm: view.rssiDbm,
    batteryVolt: view.batteryVolt,
    coordinateLabel: view.coordinate.label,
    markerLeft: view.coordinate.markerLeft,
    markerTop: view.coordinate.markerTop,
    rawPayload: {
      distance: view.rawPayloadPreview.distance,
      H_cm: view.rawPayloadPreview.H_cm,
      volume: view.rawPayloadPreview.volume,
      percent: view.rawPayloadPreview.percent,
      wifi_rssi: view.rawPayloadPreview.wifi_rssi,
    },
    dataSources: view.dataSources,
    configReview: view.configReview,
    readings: view.readings.map(toReadingPoint),
    chartTrends,
    nearbySites: view.nearbySites.map(toNearbySite),
  };
}
