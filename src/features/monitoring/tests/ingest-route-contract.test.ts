import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ingest/route";
import { checkRateLimit } from "@/features/auth/lib/rate-limit";
import { resetMonitoringReadings } from "../lib/telemetry-store";

// Tes karakterisasi kontrak perangkat v1: mengunci perilaku POST /api/ingest
// apa adanya (status, isi balasan, header) karena firmware yang terpasang
// tidak bisa diperbarui dari jauh.

vi.mock("@/features/auth/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

const FIXED_NOW = new Date("2026-10-25T03:00:00.000Z");

function ingestRequest({
  body,
  headers = {},
}: {
  body: string;
  headers?: Record<string, string>;
}): Request {
  return new Request("http://localhost/api/ingest", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function validHeaders(): Record<string, string> {
  return { "x-device-id": "demo-tph-01", "x-api-key": "demo-tph-key" };
}

async function readJson(response: Response): Promise<unknown> {
  return JSON.parse(await response.text());
}

describe("kontrak POST /api/ingest (v1, dibekukan)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
    vi.stubEnv("SOLAR_TANK_STORAGE_DRIVER", "memory");
    vi.stubEnv("SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK", "false");
    vi.stubEnv("SOLAR_TANK_AUTO_PROVISION_DEVICES", "false");
    vi.stubEnv("SOLAR_TANK_LOCAL_DEVICE_KEY", "");
    vi.stubEnv("SOLAR_TANK_DEVICE_PROVISIONING_KEY", "");
    resetMonitoringReadings();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.mocked(checkRateLimit).mockReset();
    resetMonitoringReadings();
  });

  it("menolak tanpa header X-Device-Id dengan 400", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: { "x-api-key": "demo-tph-key" },
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Header X-Device-Id wajib diisi.",
    });
  });

  it("menolak tanpa header kunci perangkat dengan 401", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: { "x-device-id": "demo-tph-01" },
      }),
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Header X-Api-Key atau X-Device-Key wajib diisi.",
    });
  });

  it("menolak body yang bukan JSON valid dengan 400", async () => {
    const response = await POST(
      ingestRequest({ body: "{bukan json", headers: validHeaders() }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Body request harus JSON valid.",
    });
  });

  it("menolak JSON yang bukan object (misalnya array) dengan 400", async () => {
    const response = await POST(
      ingestRequest({ body: "[1,2,3]", headers: validHeaders() }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Payload harus berupa object JSON.",
    });
  });

  it("menolak perangkat yang tidak terdaftar dengan 404", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "perangkat-asing", distance_cm: 30 }),
        headers: { "x-device-id": "perangkat-asing", "x-api-key": "kunci" },
      }),
    );

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Device tidak terdaftar di data operasional.",
    });
  });

  it("menolak kunci perangkat yang salah dengan 401", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: { "x-device-id": "demo-tph-01", "x-api-key": "kunci-salah" },
      }),
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Device key tidak valid.",
    });
  });

  it("menolak identitas di payload yang berbeda dari header dengan 400", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-nja-01", distance_cm: 30 }),
        headers: validHeaders(),
      }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Identitas device di payload tidak sesuai dengan header.",
    });
  });

  it("menerima X-Device-Key sebagai pengganti X-Api-Key", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: {
          "x-device-id": "demo-tph-01",
          "x-device-key": "demo-tph-key",
        },
      }),
    );

    expect(response.status).toBe(201);
  });

  it("mendahulukan X-Api-Key bila kedua header kunci dikirim", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: {
          "x-device-id": "demo-tph-01",
          "x-api-key": "kunci-salah",
          "x-device-key": "demo-tph-key",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("mengembalikan 201 dengan isi balasan yang sama untuk kiriman valid", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({
          device_id: "demo-tph-01",
          distance_cm: 40,
          distance: 40,
          distance_raw_cm: 40,
          rssi: -60,
          voltage: 3.7,
        }),
        headers: validHeaders(),
      }),
    );

    expect(response.status).toBe(201);
    expect(await readJson(response)).toMatchInlineSnapshot(`
      {
        "data": {
          "activated": false,
          "batteryVolt": 3.7,
          "configStatus": "normal",
          "deviceId": "demo-tph-01",
          "deviceInternalId": "device-tph-main",
          "fillPercent": 78.61,
          "fuelHeightCm": 110,
          "measuredAt": "2026-10-25T03:00:00.000Z",
          "needsReview": false,
          "provisioned": false,
          "readingId": "reading-device-tph-main-1792897200000",
          "receivedAt": "2026-10-25T03:00:00.000Z",
          "rssiDbm": -60,
          "runtimeHour": 157.22,
          "sensorDistanceCm": 40,
          "storage": "memory",
          "tankId": "tank-tph-main",
          "volumeLiter": 3930.42,
          "warnings": [],
        },
        "ok": true,
      }
    `);
  });

  it("mempertahankan perilaku saat ini: kiriman tanpa jarak dibaca 0 cm (tangki penuh) dan tetap 201 (FTM-010)", async () => {
    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01" }),
        headers: validHeaders(),
      }),
    );
    const body = (await readJson(response)) as {
      data: {
        sensorDistanceCm: number;
        fillPercent: number;
        warnings: string[];
      };
    };

    expect(response.status).toBe(201);
    expect(body.data.sensorDistanceCm).toBe(0);
    expect(body.data.fillPercent).toBe(100);
    expect(body.data.warnings).toContain(
      "Payload tidak membawa distance_cm; jarak sensor fallback ke 0 cm.",
    );
  });

  it("tidak memanggil pembatas permintaan saat penyimpanan memori", async () => {
    await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: validHeaders(),
      }),
    );

    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("membalas 429 dengan Retry-After saat batas 120 permintaan per menit terlampaui (MySQL)", async () => {
    vi.stubEnv("SOLAR_TANK_STORAGE_DRIVER", "mysql");
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 42,
    });

    const response = await POST(
      ingestRequest({
        body: JSON.stringify({ device_id: "demo-tph-01", distance_cm: 30 }),
        headers: { ...validHeaders(), "x-forwarded-for": "10.0.0.5, 10.0.0.1" },
      }),
    );

    expect(checkRateLimit).toHaveBeenCalledWith({
      key: "ingest:demo-tph-01:10.0.0.5",
      limit: 120,
      windowMs: 60_000,
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "Terlalu banyak request device. Coba lagi sebentar.",
    });
  });

  it("memeriksa pembatas permintaan sebelum membaca body (MySQL)", async () => {
    vi.stubEnv("SOLAR_TANK_STORAGE_DRIVER", "mysql");
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 1,
    });

    const response = await POST(
      ingestRequest({ body: "{bukan json", headers: {} }),
    );

    expect(checkRateLimit).toHaveBeenCalledWith({
      key: "ingest:unknown-device:unknown",
      limit: 120,
      windowMs: 60_000,
    });
    expect(response.status).toBe(429);
  });
});
