import { describe, expect, it } from "vitest";

import {
  jsonCaughtError,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
} from "./json-response";

describe("json-response", () => {
  it("jsonOk menulis { ok: true, data } dengan status 200", async () => {
    const response = jsonOk({ message: "Tersimpan." });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.text()).toBe(
      '{"ok":true,"data":{"message":"Tersimpan."}}',
    );
  });

  it("jsonOk tanpa data menulis { ok: true } saja", async () => {
    expect(await jsonOk().text()).toBe('{"ok":true}');
  });

  it("jsonOk meneruskan status lain, misalnya 201 untuk ingest", async () => {
    const response = jsonOk({ id: "r-1" }, { status: 201 });

    expect(response.status).toBe(201);
    expect(await response.text()).toBe('{"ok":true,"data":{"id":"r-1"}}');
  });

  it("jsonError menulis { ok: false, error } dengan status yang diberikan", async () => {
    const response = jsonError("Tangki tidak ditemukan.", 404);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe(
      '{"ok":false,"error":"Tangki tidak ditemukan."}',
    );
  });

  it("jsonTooManyRequests membalas 429 dengan Retry-After dalam detik", async () => {
    const response = jsonTooManyRequests("Terlalu banyak permintaan.", 42);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(await response.text()).toBe(
      '{"ok":false,"error":"Terlalu banyak permintaan."}',
    );
  });

  it("jsonCaughtError meneruskan pesan error biasa dengan status 400", async () => {
    const response = jsonCaughtError(new Error("Email wajib diisi."), {
      fallbackMessage: "Gagal.",
      internalMessage: "Layanan sedang disiapkan.",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      '{"ok":false,"error":"Email wajib diisi."}',
    );
  });

  it("jsonCaughtError menyembunyikan error database dengan status 500", async () => {
    const response = jsonCaughtError(new Error("ER_NO_SUCH_TABLE: mysql"), {
      fallbackMessage: "Gagal.",
      internalMessage: "Layanan sedang disiapkan.",
    });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe(
      '{"ok":false,"error":"Layanan sedang disiapkan."}',
    );
  });

  it("jsonCaughtError memakai status bawaan yang diberikan, misalnya 401 untuk login", async () => {
    const response = jsonCaughtError(
      "bukan Error",
      {
        fallbackMessage: "Login gagal.",
        internalMessage: "Layanan sedang disiapkan.",
      },
      { defaultStatus: 401 },
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('{"ok":false,"error":"Login gagal."}');
  });
});
