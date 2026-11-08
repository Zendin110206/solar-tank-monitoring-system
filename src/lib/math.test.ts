import { describe, expect, it } from "vitest";

import { clamp, clampPercent } from "./math";

// Dua bentuk lama yang kini diganti `clamp`: peta memakai bentuk pertama, grafik volume dan
// visual 3D memakai bentuk kedua. Math.min/Math.max komutatif, jadi hasilnya harus sama
// untuk semua masukan, termasuk NaN, nol bertanda, dan tak hingga.
const mapClamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const chartClamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const values = [
  Number.NaN,
  Number.NEGATIVE_INFINITY,
  -1e9,
  -1,
  -0,
  0,
  0.5,
  1,
  99.999,
  100,
  1e9,
  Number.POSITIVE_INFINITY,
];

describe("clamp", () => {
  it("sama persis dengan kedua bentuk lama untuk semua kombinasi nilai", () => {
    for (const value of values) {
      for (const min of values) {
        for (const max of values) {
          expect(
            Object.is(clamp(value, min, max), mapClamp(value, min, max)),
          ).toBe(true);
          expect(
            Object.is(clamp(value, min, max), chartClamp(value, min, max)),
          ).toBe(true);
        }
      }
    }
  });

  it("membatasi nilai ke rentang", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(42, 0, 100)).toBe(42);
    expect(clamp(150, 0, 100)).toBe(100);
  });
});

describe("clampPercent", () => {
  it("membatasi persen ke 0–100", () => {
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(55.5)).toBe(55.5);
    expect(clampPercent(120)).toBe(100);
  });
});
