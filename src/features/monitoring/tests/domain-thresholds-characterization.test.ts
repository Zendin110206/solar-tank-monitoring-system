import { describe, expect, it } from "vitest";

import type { Tank } from "../types/monitoring";
import {
  calculateDeviceRequestCapacityLiter,
  calculateOperationalConsumptionLiterPerHour,
  calculateOperationalLoadKw,
} from "../lib/device-request";
import { buildMonitoringRollupWindow } from "../lib/reading-rollup";
import { calculateRuntimeHours } from "../lib/runtime";
import {
  getDeviceStatus,
  getLevelStatus,
  getOperationalStatus,
  getRuntimeStatus,
} from "../lib/status";
import {
  calculateFillPercent,
  calculateTankVolumeLiter,
  getMaxFuelHeightCm,
} from "../lib/tank-volume";
import { loadSourceDeclarations } from "./helpers/load-source-declarations";

// Tes karakterisasi perhitungan domain. Mengunci perilaku saat ini, termasuk
// perbedaan yang tercatat (FTM-011, FTM-018) dan akan dibahas di paket kerja
// domain. Jangan "memperbaiki" angka di sini.

type RuntimeLevel = { label: string; range: string };
type PageThresholds = {
  getRuntimeLevelParameter: (runtimeHour: number | null) => RuntimeLevel;
};

const RUNTIME_SAMPLES = [
  null,
  Number.NaN,
  0,
  12.99,
  13,
  13.99,
  14,
  15.99,
  16,
  18.99,
  19,
  23.99,
  24,
  24.01,
  100,
];

const rectangularTank: Tank = {
  id: "tank-balok",
  siteId: "site-contoh",
  name: "Balok",
  shape: "rectangular",
  capacityLiter: 1200,
  lengthCm: 150,
  widthCm: 80,
  heightCm: 100,
  sensorMountHeightCm: 110,
  lowLevelPercent: 30,
  criticalLevelPercent: 15,
  consumptionLiterPerHour: 5.25,
  isActive: true,
};

const cylinderTank: Tank = {
  id: "tank-silinder",
  siteId: "site-contoh",
  name: "Silinder",
  shape: "horizontal-cylinder",
  capacityLiter: 5000,
  diameterCm: 150,
  lengthCm: 283,
  sensorMountHeightCm: 150,
  lowLevelPercent: 30,
  criticalLevelPercent: 15,
  consumptionLiterPerHour: 25,
  isActive: true,
};

describe("ambang sisa jam genset di tiga tempat (FTM-018)", () => {
  it("status.ts memakai 4 kelas dengan batas 13, 16, dan <= 24 jam", () => {
    expect(RUNTIME_SAMPLES.map((hour) => getRuntimeStatus(hour))).toEqual([
      "unknown",
      "unknown",
      "critical",
      "critical",
      "warning",
      "warning",
      "warning",
      "warning",
      "limited",
      "limited",
      "limited",
      "limited",
      "limited",
      "safe",
      "safe",
    ]);
  });

  it.each([
    "src/app/dashboard/tanks/[tankId]/page.tsx",
    "src/app/dashboard/ringkas/tanks/[tankId]/page.tsx",
  ])(
    "%s memakai 6 kelas dengan batas 13, 14, 16, 19, dan < 24 jam",
    (pagePath) => {
      const { getRuntimeLevelParameter } =
        loadSourceDeclarations<PageThresholds>(pagePath, [
          "runtimeLevelParameters",
          "unknownRuntimeLevel",
          "getRuntimeLevelParameter",
        ] as never);

      expect(
        RUNTIME_SAMPLES.map((hour) => {
          const level = getRuntimeLevelParameter(hour);
          return `${level.label} (${level.range})`;
        }),
      ).toEqual([
        "Belum terbaca (-)",
        "Belum terbaca (-)",
        "Kritis (< 13 jam)",
        "Kritis (< 13 jam)",
        "Threshold Under (13 - <14 jam)",
        "Threshold Under (13 - <14 jam)",
        "Under (14 - <16 jam)",
        "Under (14 - <16 jam)",
        "Threshold Upper (16 - <19 jam)",
        "Threshold Upper (16 - <19 jam)",
        "Upper (19 - <24 jam)",
        "Upper (19 - <24 jam)",
        "Overstock (>= 24 jam)",
        "Overstock (>= 24 jam)",
        "Overstock (>= 24 jam)",
      ]);
    },
  );

  it("mempertahankan perbedaan saat ini: tepat 24 jam = 'limited' di status.ts tetapi 'Overstock' di halaman detail", () => {
    const { getRuntimeLevelParameter } = loadSourceDeclarations<PageThresholds>(
      "src/app/dashboard/tanks/[tankId]/page.tsx",
      [
        "runtimeLevelParameters",
        "unknownRuntimeLevel",
        "getRuntimeLevelParameter",
      ] as never,
    );

    expect(getRuntimeStatus(24)).toBe("limited");
    expect(getRuntimeLevelParameter(24).label).toBe("Overstock");
  });
});

describe("status level, perangkat, dan operasional", () => {
  it("memakai ambang level tetap 15/30/50% dan mengabaikan ambang per tangki", () => {
    expect(
      [0, 14.99, 15, 29.99, 30, 49.99, 50, 100].map(getLevelStatus),
    ).toEqual([
      "critical",
      "critical",
      "low",
      "low",
      "warning",
      "warning",
      "safe",
      "safe",
    ]);
  });

  it("menghitung status perangkat dari 2x dan 4x interval kirim", () => {
    const now = new Date("2026-10-25T03:00:00.000Z");
    const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

    expect(
      [0, 40, 41, 80, 81].map((seconds) =>
        getDeviceStatus({
          lastReceivedAt: ago(seconds),
          now,
          expectedReportIntervalSec: 20,
        }),
      ),
    ).toEqual(["online", "online", "delayed", "delayed", "offline"]);
    expect(
      getDeviceStatus({
        lastReceivedAt: null,
        now,
        expectedReportIntervalSec: 20,
      }),
    ).toBe("unknown");
    expect(
      getDeviceStatus({
        lastReceivedAt: ago(10),
        now,
        expectedReportIntervalSec: 0,
      }),
    ).toBe("unknown");
  });

  it("mempertahankan perilaku saat ini: perangkat offline langsung membuat status operasional kritis", () => {
    expect(
      getOperationalStatus({
        runtimeStatus: "safe",
        levelStatus: "safe",
        deviceStatus: "offline",
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

describe("volume tangki", () => {
  it("menghitung balok dan mengunci di kedua ujung", () => {
    expect(getMaxFuelHeightCm(rectangularTank)).toBe(100);
    expect(calculateTankVolumeLiter(rectangularTank, -10)).toBe(0);
    expect(calculateTankVolumeLiter(rectangularTank, 0)).toBe(0);
    expect(calculateTankVolumeLiter(rectangularTank, 33.33)).toBe(399.96);
    expect(calculateTankVolumeLiter(rectangularTank, 100)).toBe(1200);
    expect(calculateTankVolumeLiter(rectangularTank, 150)).toBe(1200);
  });

  it("menghitung silinder horizontal dan mengunci di kedua ujung serta kapasitas", () => {
    expect(getMaxFuelHeightCm(cylinderTank)).toBe(150);
    expect(calculateTankVolumeLiter(cylinderTank, 0)).toBe(0);
    expect(calculateTankVolumeLiter(cylinderTank, 37.5)).toBe(977.71);
    expect(calculateTankVolumeLiter(cylinderTank, 75)).toBe(2500.51);
    expect(calculateTankVolumeLiter(cylinderTank, 110)).toBe(3930.42);
    expect(calculateTankVolumeLiter(cylinderTank, 150)).toBe(5000);
    expect(calculateTankVolumeLiter(cylinderTank, 200)).toBe(5000);
  });

  it("mengunci persen isi 0-100 dan 0 bila kapasitas tidak valid", () => {
    expect(calculateFillPercent(-1, 1000)).toBe(0);
    expect(calculateFillPercent(333.333, 1000)).toBe(33.33);
    expect(calculateFillPercent(1500, 1000)).toBe(100);
    expect(calculateFillPercent(10, 0)).toBe(0);
  });

  it("menghitung sisa jam dari volume dibagi konsumsi, dibulatkan 2 desimal", () => {
    expect(calculateRuntimeHours(720, 5.25)).toBe(137.14);
    expect(calculateRuntimeHours(-5, 5.25)).toBe(0);
    expect(calculateRuntimeHours(720, 0)).toBeNull();
  });
});

describe("perhitungan pengajuan perangkat", () => {
  it("menghitung kapasitas balok dari dimensi", () => {
    expect(
      calculateDeviceRequestCapacityLiter({
        tankShape: "rectangular",
        lengthCm: 150,
        widthCm: 80,
        heightCm: 100,
      } as never),
    ).toBe(1200);
  });

  it("mempertahankan perilaku saat ini: konsumsi = 0,21 x beban kVA, kapasitas mesin saling meniadakan (FTM-011)", () => {
    const loads = [
      {
        loadValue: 20,
        loadUnit: "kw",
        dieselEngineCapacityKva: 40,
        cosPhi: 0.8,
      },
      {
        loadValue: 20,
        loadUnit: "kw",
        dieselEngineCapacityKva: 100,
        cosPhi: 0.8,
      },
      {
        loadValue: 25,
        loadUnit: "kva",
        dieselEngineCapacityKva: 40,
        cosPhi: 0.8,
      },
      {
        loadValue: 15,
        loadUnit: "kva",
        dieselEngineCapacityKva: 20,
        cosPhi: 0.85,
      },
    ] as const;

    expect(
      loads.map((load) => calculateOperationalConsumptionLiterPerHour(load)),
    ).toEqual([5.25, 5.25, 5.25, 3.15]);
    expect(
      calculateOperationalConsumptionLiterPerHour({
        loadValue: 20,
        loadUnit: "kw",
        dieselEngineCapacityKva: 0,
        cosPhi: 0.8,
      }),
    ).toBe(0);
  });

  it("mengubah beban kVA menjadi kW dengan cos phi", () => {
    expect(
      calculateOperationalLoadKw({
        loadValue: 25,
        loadUnit: "kva",
        cosPhi: 0.8,
      }),
    ).toBe(20);
    expect(
      calculateOperationalLoadKw({
        loadValue: 20,
        loadUnit: "kw",
        cosPhi: 0.8,
      }),
    ).toBe(20);
  });
});

describe("bucket ringkasan 5 menit", () => {
  it("memakai waktu terima server dan batas bucket yang inklusif di awal", () => {
    expect(
      buildMonitoringRollupWindow({
        deviceId: "device-contoh",
        receivedAt: "2026-10-25T03:04:59.999Z",
      }),
    ).toEqual({
      id: "rollup-5m-device-contoh-1792897200000",
      start: "2026-10-25T03:00:00.000Z",
      end: "2026-10-25T03:05:00.000Z",
    });
    expect(
      buildMonitoringRollupWindow({
        deviceId: "device-contoh",
        receivedAt: "2026-10-25T03:05:00.000Z",
      }).start,
    ).toBe("2026-10-25T03:05:00.000Z");
  });
});
