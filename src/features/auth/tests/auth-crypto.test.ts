import { describe, expect, it } from "vitest";

import {
  createLegacyPbkdf2PasswordHashForTest,
  createOtpCode,
  createRandomToken,
  hashOneTimeToken,
  hashOtpCode,
  hashPassword,
  passwordNeedsRehash,
  verifyOtpHash,
  verifyPassword,
} from "../lib/auth-crypto";
import {
  createAdminActionCsrfToken,
  verifyAdminActionCsrfToken,
} from "../lib/auth-csrf";
import {
  parseLoginPayload,
  parseChangePasswordPayload,
  parseForgotPasswordPayload,
  normalizeIndonesianMobilePhone,
  parseRegisterAccessPayload,
  parseResetPasswordPayload,
} from "../lib/auth-validation";

describe("auth crypto", () => {
  it("memverifikasi password hanya untuk input yang benar", async () => {
    const hash = await hashPassword("password-operator-kuat");

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(passwordNeedsRehash(hash)).toBe(false);
    await expect(verifyPassword("password-operator-kuat", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("password-salah", hash)).resolves.toBe(false);
  });

  it("tetap bisa membaca hash PBKDF2 lama dan menandainya untuk upgrade", async () => {
    const legacyHash = await createLegacyPbkdf2PasswordHashForTest(
      "password-lama-kuat",
    );

    expect(legacyHash).toMatch(/^pbkdf2-sha256\$/);
    expect(passwordNeedsRehash(legacyHash)).toBe(true);
    await expect(verifyPassword("password-lama-kuat", legacyHash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("password-salah", legacyHash)).resolves.toBe(
      false,
    );
  });

  it("memverifikasi OTP hanya untuk kode yang benar", () => {
    const code = createOtpCode();
    const hash = hashOtpCode(code);

    expect(code).toMatch(/^\d{6}$/);
    expect(verifyOtpHash(code, hash)).toBe(true);
    expect(verifyOtpHash("000000" === code ? "111111" : "000000", hash)).toBe(
      false,
    );
  });

  it("mengikat token aksi admin ke sesi yang benar", () => {
    const token = createAdminActionCsrfToken("sess_admin_utama");

    expect(
      verifyAdminActionCsrfToken({
        sessionId: "sess_admin_utama",
        token,
      }),
    ).toBe(true);
    expect(
      verifyAdminActionCsrfToken({
        sessionId: "sess_admin_lain",
        token,
      }),
    ).toBe(false);
    expect(
      verifyAdminActionCsrfToken({
        sessionId: "sess_admin_utama",
        token: null,
      }),
    ).toBe(false);
  });

  it("menghasilkan hash token sekali pakai tanpa menyimpan token mentah", () => {
    const token = createRandomToken();
    const hash = hashOneTimeToken(token);

    expect(hash).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashOneTimeToken(token)).toBe(hash);
  });
});

describe("auth validation", () => {
  it("menormalisasi payload login", () => {
    expect(
      parseLoginPayload({
        identity: " ADMIN@CONTOH.CO.ID ",
        password: "secret",
      }),
    ).toEqual({
      identity: "admin@contoh.co.id",
      password: "secret",
    });
  });

  it("menolak pengajuan akses dengan password lemah", () => {
    expect(() =>
      parseRegisterAccessPayload({
        fullName: "Operator",
        username: "operator",
        email: "operator@example.com",
        phone: "081234567890",
        password: "pendek",
        confirmPassword: "pendek",
      }),
    ).toThrow("minimal 10 karakter");
  });

  it("menormalisasi nomor seluler Indonesia ke format +62", () => {
    expect(normalizeIndonesianMobilePhone("0812 3456 7890")).toBe(
      "+6281234567890",
    );
    expect(normalizeIndonesianMobilePhone("6281234567890")).toBe(
      "+6281234567890",
    );
    expect(normalizeIndonesianMobilePhone("+62 812-3456-7890")).toBe(
      "+6281234567890",
    );
    expect(normalizeIndonesianMobilePhone("81234567890")).toBe(
      "+6281234567890",
    );
  });

  it("menolak nomor telepon yang tidak bisa disimpan konsisten", () => {
    expect(() => normalizeIndonesianMobilePhone("")).toThrow("wajib diisi");
    expect(() => normalizeIndonesianMobilePhone("nomor saya")).toThrow(
      "wajib memakai angka",
    );
    expect(() => normalizeIndonesianMobilePhone("+621234")).toThrow(
      "nomor seluler Indonesia",
    );
  });

  it("menyimpan payload register dengan nomor telepon yang sudah dinormalisasi", () => {
    expect(
      parseRegisterAccessPayload({
        fullName: "Operator Monitoring",
        username: "operator_1",
        email: "Operator@Example.com",
        phone: "0822-3163-9644",
        password: "Password12345",
        confirmPassword: "Password12345",
      }),
    ).toMatchObject({
      email: "operator@example.com",
      phone: "+6282231639644",
      username: "operator_1",
    });
  });

  it("menolak password terlalu panjang sebelum proses hash", () => {
    expect(() =>
      parseLoginPayload({
        identity: "operator",
        password: "x".repeat(257),
      }),
    ).toThrow("terlalu panjang");
  });

  it("memvalidasi payload lupa password secara generik", () => {
    expect(
      parseForgotPasswordPayload({
        identity: " OPERATOR@CONTOH.CO.ID ",
        captchaToken: " token ",
      }),
    ).toEqual({
      identity: "operator@contoh.co.id",
      captchaToken: "token",
    });
  });

  it("memvalidasi reset password dengan token dan password kuat", () => {
    expect(
      parseResetPasswordPayload({
        token: "reset-token",
        password: "Password12345",
        confirmPassword: "Password12345",
      }),
    ).toEqual({
      token: "reset-token",
      password: "Password12345",
      confirmPassword: "Password12345",
    });
    expect(() =>
      parseResetPasswordPayload({
        token: "reset-token",
        password: "passwordtanpaangka",
        confirmPassword: "passwordtanpaangka",
      }),
    ).toThrow("huruf dan angka");
  });

  it("menolak change password jika password baru sama dengan lama", () => {
    expect(() =>
      parseChangePasswordPayload({
        currentPassword: "Password12345",
        password: "Password12345",
        confirmPassword: "Password12345",
      }),
    ).toThrow("harus berbeda");
  });
});
