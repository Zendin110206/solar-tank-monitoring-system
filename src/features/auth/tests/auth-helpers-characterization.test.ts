import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAuthId,
  createOtpCode,
  createRandomToken,
  hashOneTimeToken,
  hashOtpCode,
  hashRequestFingerprint,
  hashSessionToken,
  verifyOtpHash,
} from "../server/auth-crypto";
import {
  createAdminActionCsrfToken,
  verifyAdminActionCsrfToken,
} from "../server/auth-csrf";

// Tes karakterisasi pembantu akun. Hash yang tersimpan di database (sesi,
// token sekali pakai, OTP) harus tetap sama setelah perapian; bila berubah,
// semua sesi dan tautan yang sedang berlaku akan tidak dikenali.

const TEST_SECRET = "rahasia-uji-karakterisasi-minimal-32-karakter";

describe("hash dan token akun (nilai dikunci)", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("menghasilkan hash yang sama untuk masukan dan rahasia yang sama", () => {
    expect({
      session: hashSessionToken("token-sesi-contoh"),
      oneTime: hashOneTimeToken("token-sekali-pakai-contoh"),
      otp: hashOtpCode("123456"),
      fingerprint: hashRequestFingerprint(" 203.0.113.7 "),
      csrf: createAdminActionCsrfToken("sess_contoh"),
    }).toMatchInlineSnapshot(`
      {
        "csrf": "v1.28edc6e033a46545ea67835d0dfcfd7798d6b6d647e9878010dab13e5d33cd27",
        "fingerprint": "sha256:087a9719748b72879266caa4079e7b4975c36b426a2b552c3886155ab4653dc3",
        "oneTime": "hmac-sha256:0c03f4acb8d2dd356dabbed5d2e0495708fdc1644c7e358c0d34d4fb38a5dc8f",
        "otp": "hmac-sha256:dffdc4bbd5272be4f7618840c3e47859d6c2396559492d586792f4e8278ee2c3",
        "session": "sha256:d833ea3b4d071dd5e3077170c875d670d5b2dd4178a6a0c8d37aceb7aca4c786",
      }
    `);
  });

  it("memakai awalan algoritme yang tersimpan di database", () => {
    expect(hashSessionToken("a")).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hashOneTimeToken("a")).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(hashOtpCode("000000")).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(hashRequestFingerprint("a")).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(createAdminActionCsrfToken("s")).toMatch(/^v1\.[a-f0-9]{64}$/);
  });

  it("mengabaikan sidik permintaan yang kosong", () => {
    expect(hashRequestFingerprint(null)).toBeNull();
    expect(hashRequestFingerprint("   ")).toBeNull();
  });

  it("hanya menerima OTP dengan awalan hmac-sha256 dan kode yang sama", () => {
    const hash = hashOtpCode("654321");

    expect(verifyOtpHash("654321", hash)).toBe(true);
    expect(verifyOtpHash("654320", hash)).toBe(false);
    expect(verifyOtpHash("654321", hash.replace("hmac-sha256", "sha256"))).toBe(
      false,
    );
    expect(verifyOtpHash("654321", "hmac-sha256:")).toBe(false);
  });

  it("menolak token CSRF tanpa awalan v1 atau yang diubah", () => {
    const token = createAdminActionCsrfToken("sess_contoh");

    expect(
      verifyAdminActionCsrfToken({ sessionId: "sess_contoh", token }),
    ).toBe(true);
    expect(
      verifyAdminActionCsrfToken({
        sessionId: "sess_contoh",
        token: token.replace("v1.", "v2."),
      }),
    ).toBe(false);
    expect(
      verifyAdminActionCsrfToken({
        sessionId: "sess_contoh",
        token: `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`,
      }),
    ).toBe(false);
    expect(
      verifyAdminActionCsrfToken({ sessionId: "sess_contoh", token: "" }),
    ).toBe(false);
  });

  it("mengubah semua hash bila rahasia aplikasi berubah", () => {
    const before = hashOneTimeToken("token");
    vi.stubEnv("AUTH_SECRET", `${TEST_SECRET}-lain`);

    expect(hashOneTimeToken("token")).not.toBe(before);
    expect(hashSessionToken("token")).toBe(
      "sha256:3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
    );
  });
});

describe("nilai acak akun (format dikunci)", () => {
  it("membuat id, token, dan OTP dengan format tetap", () => {
    expect(createAuthId("usr")).toMatch(/^usr_[A-Za-z0-9_-]{24}$/);
    expect(createRandomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(createOtpCode()).toMatch(/^\d{6}$/);
    expect(createRandomToken()).not.toBe(createRandomToken());
  });
});
