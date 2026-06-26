import type { Tank } from "../types/monitoring";
import { clampNumber, roundTo } from "./number";

type FuelHeightInput = {
  sensorMountHeightCm: number;
  sensorDistanceCm: number;
  maxFuelHeightCm: number;
};

type HorizontalCylinderVolumeInput = {
  diameterCm: number;
  lengthCm: number;
  fuelHeightCm: number;
};

type RectangularVolumeInput = {
  lengthCm: number;
  widthCm: number;
  fuelHeightCm: number;
  maxFuelHeightCm: number;
};

export function getMaxFuelHeightCm(tank: Tank): number {
  if (tank.shape === "horizontal-cylinder") {
    return tank.diameterCm ?? tank.sensorMountHeightCm;
  }

  return tank.heightCm ?? tank.sensorMountHeightCm;
}

export function calculateFuelHeightCm({
  sensorMountHeightCm,
  sensorDistanceCm,
  maxFuelHeightCm,
}: FuelHeightInput): number {
  const rawHeight = sensorMountHeightCm - sensorDistanceCm;
  return roundTo(clampNumber(rawHeight, 0, maxFuelHeightCm), 2);
}

export function calculateHorizontalCylinderVolumeLiter({
  diameterCm,
  lengthCm,
  fuelHeightCm,
}: HorizontalCylinderVolumeInput): number {
  if (diameterCm <= 0 || lengthCm <= 0) {
    return 0;
  }

  const radiusCm = diameterCm / 2;
  const safeHeightCm = clampNumber(fuelHeightCm, 0, diameterCm);

  if (safeHeightCm === 0) {
    return 0;
  }

  if (safeHeightCm === diameterCm) {
    return roundTo((Math.PI * radiusCm ** 2 * lengthCm) / 1000, 2);
  }

  const segmentAreaCm2 =
    radiusCm ** 2 * Math.acos((radiusCm - safeHeightCm) / radiusCm) -
    (radiusCm - safeHeightCm) *
      Math.sqrt(Math.max(0, 2 * radiusCm * safeHeightCm - safeHeightCm ** 2));

  return roundTo((segmentAreaCm2 * lengthCm) / 1000, 2);
}

export function calculateRectangularVolumeLiter({
  lengthCm,
  widthCm,
  fuelHeightCm,
  maxFuelHeightCm,
}: RectangularVolumeInput): number {
  if (lengthCm <= 0 || widthCm <= 0 || maxFuelHeightCm <= 0) {
    return 0;
  }

  const safeHeightCm = clampNumber(fuelHeightCm, 0, maxFuelHeightCm);
  return roundTo((lengthCm * widthCm * safeHeightCm) / 1000, 2);
}

export function calculateTankVolumeLiter(
  tank: Tank,
  fuelHeightCm: number,
): number {
  const maxFuelHeightCm = getMaxFuelHeightCm(tank);

  let volumeLiter = 0;

  if (
    tank.shape === "horizontal-cylinder" &&
    tank.diameterCm &&
    tank.lengthCm
  ) {
    volumeLiter = calculateHorizontalCylinderVolumeLiter({
      diameterCm: tank.diameterCm,
      lengthCm: tank.lengthCm,
      fuelHeightCm,
    });
  }

  if (
    tank.shape === "rectangular" &&
    tank.lengthCm &&
    tank.widthCm &&
    maxFuelHeightCm
  ) {
    volumeLiter = calculateRectangularVolumeLiter({
      lengthCm: tank.lengthCm,
      widthCm: tank.widthCm,
      fuelHeightCm,
      maxFuelHeightCm,
    });
  }

  return roundTo(clampNumber(volumeLiter, 0, tank.capacityLiter), 2);
}

export function calculateFillPercent(
  volumeLiter: number,
  capacityLiter: number,
): number {
  if (capacityLiter <= 0) {
    return 0;
  }

  return roundTo(clampNumber((volumeLiter / capacityLiter) * 100, 0, 100), 2);
}