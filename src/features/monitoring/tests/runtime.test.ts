import { describe, expect, it } from "vitest";
import { calculateRuntimeHours } from "../lib/runtime";

describe("runtime calculation", () => {
  it("calculates runtime from volume and hourly consumption", () => {
    expect(calculateRuntimeHours(3900, 25)).toBe(156);
  });

  it("returns null when consumption is zero or invalid", () => {
    expect(calculateRuntimeHours(3900, 0)).toBeNull();
    expect(calculateRuntimeHours(3900, -10)).toBeNull();
  });

  it("does not return negative runtime for negative volume", () => {
    expect(calculateRuntimeHours(-100, 25)).toBe(0);
  });
});