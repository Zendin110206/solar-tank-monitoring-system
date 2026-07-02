import { describe, expect, it } from "vitest";
import {
  calculateFillPercent,
  calculateFuelHeightCm,
  calculateHorizontalCylinderVolumeLiter,
} from "../lib/tank-volume";

describe("tank volume calculation", () => {
  it("calculates full horizontal cylinder volume in liter", () => {
    const volume = calculateHorizontalCylinderVolumeLiter({
      diameterCm: 20,
      lengthCm: 16,
      fuelHeightCm: 20,
    });

    expect(volume).toBeCloseTo(5.03, 2);
  });

  it("calculates half horizontal cylinder as about half of full volume", () => {
    const volume = calculateHorizontalCylinderVolumeLiter({
      diameterCm: 20,
      lengthCm: 16,
      fuelHeightCm: 10,
    });

    expect(volume).toBeCloseTo(2.51, 2);
  });

  it("clamps fuel height between zero and maximum tank height", () => {
    expect(
      calculateFuelHeightCm({
        sensorMountHeightCm: 150,
        sensorDistanceCm: 200,
        maxFuelHeightCm: 150,
      }),
    ).toBe(0);

    expect(
      calculateFuelHeightCm({
        sensorMountHeightCm: 150,
        sensorDistanceCm: -20,
        maxFuelHeightCm: 150,
      }),
    ).toBe(150);
  });

  it("calculates fuel height from tank height, not sensor offset", () => {
    expect(
      calculateFuelHeightCm({
        sensorMountHeightCm: 5,
        sensorDistanceCm: 12,
        maxFuelHeightCm: 45,
      }),
    ).toBe(33);
  });

  it("clamps fill percent between zero and one hundred", () => {
    expect(calculateFillPercent(-10, 5000)).toBe(0);
    expect(calculateFillPercent(6000, 5000)).toBe(100);
    expect(calculateFillPercent(2500, 5000)).toBe(50);
  });
});
