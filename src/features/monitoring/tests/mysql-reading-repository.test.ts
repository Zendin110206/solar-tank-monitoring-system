import { describe, expect, it } from "vitest";

import {
  formatMysqlUtcDateTime,
  parseMysqlDateTimeAsUtc,
} from "../lib/mysql-reading-repository";

describe("mysql reading repository timestamp helpers", () => {
  it("stores ISO timestamps as explicit UTC DATETIME strings", () => {
    expect(formatMysqlUtcDateTime("2026-07-02T03:15:08.123Z")).toBe(
      "2026-07-02 03:15:08.123",
    );
  });

  it("parses MySQL DATETIME strings as UTC, not machine local time", () => {
    expect(parseMysqlDateTimeAsUtc("2026-07-02 03:15:08.123")).toBe(
      "2026-07-02T03:15:08.123Z",
    );
  });
});
