import { describe, expect, it } from "vitest";
import {
  getDeviceStatus,
  getLevelStatus,
  getOperationalStatus,
  getRuntimeStatus,
} from "../lib/status";

describe("monitoring status", () => {
  it("maps runtime hours to operational runtime status", () => {
    expect(getRuntimeStatus(null)).toBe("unknown");
    expect(getRuntimeStatus(12.99)).toBe("critical");
    expect(getRuntimeStatus(13)).toBe("warning");
    expect(getRuntimeStatus(15.99)).toBe("warning");
    expect(getRuntimeStatus(16)).toBe("limited");
    expect(getRuntimeStatus(24)).toBe("limited");
    expect(getRuntimeStatus(24.01)).toBe("safe");
  });

  it("maps fill percent to level status", () => {
    expect(getLevelStatus(10)).toBe("critical");
    expect(getLevelStatus(20)).toBe("low");
    expect(getLevelStatus(35)).toBe("warning");
    expect(getLevelStatus(70)).toBe("safe");
  });

  it("maps last received time to device status based on expected interval", () => {
    const now = new Date("2026-06-25T10:00:00.000Z");

    expect(
      getDeviceStatus({
        lastReceivedAt: "2026-06-25T09:52:00.000Z",
        now,
        expectedReportIntervalSec: 300,
      }),
    ).toBe("online");

    expect(
      getDeviceStatus({
        lastReceivedAt: "2026-06-25T09:45:00.000Z",
        now,
        expectedReportIntervalSec: 300,
      }),
    ).toBe("delayed");

    expect(
      getDeviceStatus({
        lastReceivedAt: "2026-06-25T09:30:00.000Z",
        now,
        expectedReportIntervalSec: 300,
      }),
    ).toBe("offline");
  });

  it("raises operational status when runtime, level, or device is risky", () => {
    expect(
      getOperationalStatus({
        runtimeStatus: "critical",
        levelStatus: "safe",
        deviceStatus: "online",
      }),
    ).toBe("critical");

    expect(
      getOperationalStatus({
        runtimeStatus: "limited",
        levelStatus: "safe",
        deviceStatus: "online",
      }),
    ).toBe("warning");

    expect(
      getOperationalStatus({
        runtimeStatus: "safe",
        levelStatus: "safe",
        deviceStatus: "online",
      }),
    ).toBe("safe");
  });
});
