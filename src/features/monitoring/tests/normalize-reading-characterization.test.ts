import { describe, expect, it } from "vitest";

import type { Tank } from "../types/monitoring";
import { normalizeCatPayload } from "../domain/normalize-reading";

// Tes karakterisasi normalisasi kiriman perangkat. Mengunci perilaku saat ini,
// termasuk perilaku yang tercatat perlu diperbaiki di paket kerja domain.

const RECEIVED_AT = new Date("2026-10-25T03:00:00.000Z");

const registryTank: Tank = {
  id: "tank-contoh",
  siteId: "site-contoh",
  name: "Tangki contoh",
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

function normalize(payload: Record<string, unknown>) {
  return normalizeCatPayload({
    payload,
    tank: registryTank,
    fallbackDeviceId: "device-contoh",
    receivedAt: RECEIVED_AT,
    readingId: "reading-contoh",
  });
}

function devicePayloadWithConfig(overrides: Record<string, unknown> = {}) {
  return {
    device_id: "device-contoh-01",
    distance_cm: 40,
    tank_shape: "rectangular",
    capacity_liter: 1200,
    length_cm: 150,
    width_cm: 80,
    height_cm: 100,
    sensor_mount_height_cm: 110,
    low_level_percent: 30,
    critical_level_percent: 15,
    consumption_liter_per_hour: 5.25,
    ...overrides,
  };
}

describe("normalisasi jarak sensor", () => {
  it("mempertahankan perilaku saat ini: jarak kosong dibaca 0 cm sehingga tangki terbaca penuh (FTM-010)", () => {
    const reading = normalize({ device_id: "device-contoh-01" });

    expect(reading.sensorDistanceCm).toBe(0);
    expect(reading.fuelHeightCm).toBe(100);
    expect(reading.volumeLiter).toBe(1200);
    expect(reading.fillPercent).toBe(100);
    expect(reading.quality?.warnings).toContain(
      "Payload tidak membawa distance_cm; jarak sensor fallback ke 0 cm.",
    );
  });

  it("mengunci jarak negatif ke 0 cm dengan peringatan", () => {
    const reading = normalize({ distance_cm: -5 });

    expect(reading.sensorDistanceCm).toBe(0);
    expect(reading.quality?.warnings).toContain(
      "distance_cm bernilai negatif; nilai dikunci ke 0 cm.",
    );
  });

  it("mengunci jarak di atas tinggi tangki ke tinggi tangki dengan peringatan", () => {
    const reading = normalize({ distance_cm: 250 });

    expect(reading.sensorDistanceCm).toBe(100);
    expect(reading.fuelHeightCm).toBe(0);
    expect(reading.volumeLiter).toBe(0);
    expect(reading.quality?.warnings).toContain(
      "distance_cm lebih tinggi dari batas tinggi tangki; nilai dikunci ke tinggi maksimum tangki.",
    );
  });

  it("mempertahankan perilaku saat ini: tinggi solar = tinggi tangki - jarak, tanpa memakai tinggi sensor", () => {
    const reading = normalize({ distance_cm: 40 });

    expect(reading.fuelHeightCm).toBe(60);
    expect(reading.volumeLiter).toBe(720);
    expect(reading.fillPercent).toBe(60);
    expect(reading.runtimeHour).toBe(137.14);
  });

  it("membaca nama field jarak alternatif sesuai urutan prioritas", () => {
    expect(normalize({ dist_cm: 10, distance_cm: 20 }).sensorDistanceCm).toBe(
      10,
    );
    expect(normalize({ distance: 30 }).sensorDistanceCm).toBe(30);
    expect(normalize({ raw: { distance_cm: 35 } }).sensorDistanceCm).toBe(35);
  });
});

describe("pemilihan konfigurasi registry vs perangkat", () => {
  it("memakai nilai hitungan perangkat bila konfigurasi kiriman sama dengan registry", () => {
    const reading = normalize(
      devicePayloadWithConfig({ local_volume_l: 700, local_percent: 58 }),
    );

    expect(reading.volumeLiter).toBe(700);
    expect(reading.fillPercent).toBe(58);
    expect(reading.quality).toMatchObject({
      volumeSource: "device",
      fillPercentSource: "device",
      configStatus: "normal",
      configSource: "payload",
      needsReview: false,
    });
  });

  it("menganggap selisih di bawah 2% pada ukuran fisik sebagai sama", () => {
    const reading = normalize(
      devicePayloadWithConfig({ sensor_mount_height_cm: 112 }),
    );

    expect(reading.quality?.configStatus).toBe("normal");
    expect(reading.quality?.configMismatchReasons).toEqual([]);
  });

  it("mempertahankan perilaku saat ini: selisih tepat 2% terbaca sedikit di atas 2% karena pembulatan angka desimal", () => {
    const reading = normalize(
      devicePayloadWithConfig({ sensor_mount_height_cm: 112.2 }),
    );

    expect(reading.quality?.configStatus).toBe("minor_config_difference");
    expect(reading.quality?.configMismatchReasons).toEqual([
      "Tinggi sensor payload berbeda 2% dari registry.",
    ]);
  });

  it("menerima selisih ukuran fisik di atas 2% sampai 10% sebagai perbedaan kecil dan memakai konfigurasi perangkat", () => {
    const reading = normalize(
      devicePayloadWithConfig({ height_cm: 108, local_volume_l: 700 }),
    );

    expect(reading.quality).toMatchObject({
      configStatus: "minor_config_difference",
      needsReview: false,
      volumeSource: "device",
    });
    expect(reading.quality?.configMismatchReasons).toEqual([
      "Tinggi tangki payload berbeda 8% dari registry.",
    ]);
  });

  it("menandai selisih ukuran fisik di atas 10% sebagai tidak cocok dan menghitung ulang dengan registry", () => {
    const reading = normalize(
      devicePayloadWithConfig({
        sensor_mount_height_cm: 77,
        local_volume_l: 50,
        local_percent: 4,
      }),
    );

    expect(reading.quality).toMatchObject({
      configStatus: "config_mismatch",
      configSource: "registry",
      needsReview: true,
      volumeSource: "backend",
      fillPercentSource: "backend",
    });
    expect(reading.volumeLiter).toBe(720);
    expect(reading.quality?.warnings).toEqual([
      "Tinggi sensor payload berbeda 30% dari registry.",
      "Nilai tinggi, volume, dan persen dari device diabaikan sampai config payload direview.",
    ]);
  });

  it("memakai toleransi 5%/20% untuk konsumsi per jam", () => {
    expect(
      normalize(devicePayloadWithConfig({ consumption_liter_per_hour: 5.5 }))
        .quality?.configStatus,
    ).toBe("normal");
    expect(
      normalize(devicePayloadWithConfig({ consumption_liter_per_hour: 6 }))
        .quality?.configStatus,
    ).toBe("minor_config_difference");
    expect(
      normalize(devicePayloadWithConfig({ consumption_liter_per_hour: 7 }))
        .quality?.configStatus,
    ).toBe("config_mismatch");
  });

  it("memberi peringatan bila volume perangkat berbeda lebih dari 5% kapasitas dari hitungan server", () => {
    const reading = normalize(devicePayloadWithConfig({ local_volume_l: 900 }));

    expect(reading.volumeLiter).toBe(900);
    expect(reading.quality?.warnings).toContain(
      "Volume dari device berbeda lebih dari 5% kapasitas terhadap hitungan backend.",
    );
  });
});

describe("waktu pengukuran perangkat", () => {
  it("menerima waktu perangkat yang selisihnya tepat 24 jam", () => {
    const reading = normalize({
      distance_cm: 40,
      ts_iso: "2026-10-24T03:00:00.000Z",
    });

    expect(reading.measuredAt).toBe("2026-10-24T03:00:00.000Z");
    expect(reading.quality?.measuredAtSource).toBe("device");
  });

  it("memakai waktu server bila selisih lebih dari 24 jam", () => {
    const reading = normalize({
      distance_cm: 40,
      ts_iso: "2026-10-24T02:59:59.999Z",
    });

    expect(reading.measuredAt).toBe("2026-10-25T03:00:00.000Z");
    expect(reading.quality?.measuredAtSource).toBe("server");
    expect(reading.quality?.warnings).toContain(
      "Timestamp device berbeda lebih dari 24 jam dari waktu server; measuredAt memakai waktu server.",
    );
  });

  it("membaca ts dalam detik maupun milidetik", () => {
    expect(normalize({ distance_cm: 40, ts: 1792897190 }).measuredAt).toBe(
      "2026-10-25T02:59:50.000Z",
    );
    expect(normalize({ distance_cm: 40, ts: 1792897190000 }).measuredAt).toBe(
      "2026-10-25T02:59:50.000Z",
    );
  });

  it("memakai waktu server dengan peringatan bila waktu perangkat tidak valid", () => {
    const reading = normalize({ distance_cm: 40, ts_iso: "bukan-tanggal" });

    expect(reading.measuredAt).toBe("2026-10-25T03:00:00.000Z");
    expect(reading.quality?.warnings).toContain(
      "Timestamp device tidak valid; measuredAt memakai waktu server.",
    );
  });

  it("memakai waktu server tanpa peringatan bila perangkat tidak mengirim waktu", () => {
    const reading = normalize({ distance_cm: 40 });

    expect(reading.measuredAt).toBe("2026-10-25T03:00:00.000Z");
    expect(reading.receivedAt).toBe("2026-10-25T03:00:00.000Z");
    expect(reading.quality?.measuredAtSource).toBe("server");
  });
});

describe("tegangan dan sinyal", () => {
  it("menyimpan tegangan konstan dari firmware v1 apa adanya", () => {
    expect(normalize({ distance_cm: 40, voltage: 3.7 }).batteryVolt).toBe(3.7);
  });

  it("mengabaikan tegangan dan RSSI di luar rentang wajar", () => {
    const reading = normalize({ distance_cm: 40, voltage: 75, rssi: 5 });

    expect(reading.batteryVolt).toBeUndefined();
    expect(reading.rssiDbm).toBeUndefined();
    expect(reading.quality?.warnings).toEqual(
      expect.arrayContaining([
        "Tegangan payload di luar rentang wajar; nilai diabaikan.",
        "RSSI payload di luar rentang wajar; nilai diabaikan.",
      ]),
    );
  });
});
