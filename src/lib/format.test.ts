import { describe, expect, it } from "vitest";

import { formatDateTimeJakarta, formatNumber } from "./format";

// Cara lama yang disatukan ke src/lib/format.ts; hasilnya harus sama persis.
const legacyNumber = (value: number, maximumFractionDigits?: number) =>
  maximumFractionDigits === undefined
    ? new Intl.NumberFormat("id-ID").format(value)
    : new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(value);
const legacyDateOrderA = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(value));
const legacyDateOrderB = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));

describe("formatNumber", () => {
  it("memakai titik ribuan dan koma desimal", () => {
    expect(formatNumber(1234.567)).toBe("1.234,567");
    expect(formatNumber(1234.567, 0)).toBe("1.235");
    expect(formatNumber(5.25, 2)).toBe("5,25");
  });

  it("sama dengan cara lama untuk tanpa batas, 0, dan 2 angka desimal", () => {
    for (const value of [
      0, 1, 5.25, 600.5, 1008.123456, 1200, -3.75, 98765.4321,
    ]) {
      expect(formatNumber(value)).toBe(legacyNumber(value));
      expect(formatNumber(value, 0)).toBe(legacyNumber(value, 0));
      expect(formatNumber(value, 2)).toBe(legacyNumber(value, 2));
    }
  });
});

describe("formatDateTimeJakarta", () => {
  it("menulis tanggal dan jam zona Jakarta", () => {
    expect(formatDateTimeJakarta("2026-10-25T15:06:00.000Z")).toBe(
      legacyDateOrderA("2026-10-25T15:06:00.000Z"),
    );
    expect(formatDateTimeJakarta("2026-10-25T15:06:00.000Z")).toContain("2026");
  });

  it("sama dengan kedua urutan opsi lama, untuk teks maupun objek Date", () => {
    for (const value of [
      "2026-01-01T00:00:00.000Z",
      "2026-08-02T16:59:59.000Z",
      "2026-10-25T23:30:00.000+07:00",
    ]) {
      expect(formatDateTimeJakarta(value)).toBe(legacyDateOrderA(value));
      expect(formatDateTimeJakarta(value)).toBe(legacyDateOrderB(value));
      expect(formatDateTimeJakarta(new Date(value))).toBe(
        legacyDateOrderA(value),
      );
    }
  });
});
