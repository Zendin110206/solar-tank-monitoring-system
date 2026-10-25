import { NextResponse } from "next/server";

import {
  getSafeErrorMessage,
  getSafeErrorStatus,
} from "@/lib/safe-error-message";

// Bentuk balasan JSON route handler FTM:
// - berhasil: { "ok": true, "data": ... } atau { "ok": true } bila tanpa data;
// - gagal:    { "ok": false, "error": "pesan untuk pengguna" }.
// Route yang bentuk balasannya berbeda (misalnya /api/ready atau unduhan paket)
// tetap memakai NextResponse.json / Response.json langsung.

export function jsonOk(data?: unknown, init?: ResponseInit): NextResponse {
  if (data === undefined) {
    return NextResponse.json({ ok: true }, init);
  }

  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(
  error: string,
  status: number,
  init?: Omit<ResponseInit, "status">,
): NextResponse {
  return NextResponse.json({ ok: false, error }, { ...init, status });
}

// HTTP 429 dengan header Retry-After (detik) dari pembatas permintaan.
export function jsonTooManyRequests(
  error: string,
  retryAfterSeconds: number,
): NextResponse {
  return jsonError(error, 429, {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

// Balasan untuk error yang ditangkap: pesan aman (detail database/jaringan disembunyikan)
// dan status dari getSafeErrorStatus (bawaan 400, error layanan internal 500).
export function jsonCaughtError(
  error: unknown,
  messages: { fallbackMessage: string; internalMessage: string },
  statusOptions?: { defaultStatus?: number; internalStatus?: number },
): NextResponse {
  return jsonError(
    getSafeErrorMessage(error, messages),
    getSafeErrorStatus(error, statusOptions),
  );
}
