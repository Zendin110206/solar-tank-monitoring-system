"use server";

import type { LoginFormState } from "./form-state";

type TurnstileVerification = {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
};

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEVELOPMENT_TURNSTILE_SECRET =
  "1x0000000000000000000000000000000AA";

function nextState(
  previousState: LoginFormState,
  status: LoginFormState["status"],
  message: string,
): LoginFormState {
  return {
    status,
    message,
    submissionId: previousState.submissionId + 1,
  };
}

async function verifyTurnstile(token: string) {
  const configuredSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const secret =
    configuredSecret ||
    (process.env.NODE_ENV === "production"
      ? ""
      : DEVELOPMENT_TURNSTILE_SECRET);

  if (!secret) {
    return {
      ok: false,
      message: "Verifikasi keamanan belum dikonfigurasi pada server.",
    };
  }

  const verificationBody = new FormData();
  verificationBody.set("secret", secret);
  verificationBody.set("response", token);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: verificationBody,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "Layanan verifikasi keamanan sedang tidak tersedia.",
      };
    }

    const result = (await response.json()) as TurnstileVerification;
    const actionIsValid = !result.action || result.action === "login";

    if (!result.success || !actionIsValid) {
      return {
        ok: false,
        message: "Verifikasi keamanan gagal. Silakan coba kembali.",
      };
    }

    return { ok: true, message: "" };
  } catch {
    return {
      ok: false,
      message: "Verifikasi keamanan tidak dapat dihubungi. Coba lagi nanti.",
    };
  }
}

export async function submitLogin(
  previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const identity = String(formData.get("identity") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const turnstileToken = String(
    formData.get("cf-turnstile-response") ?? "",
  ).trim();

  if (identity.length < 3 || password.length === 0) {
    return nextState(
      previousState,
      "error",
      "Isi email atau nama pengguna dan kata sandi dengan benar.",
    );
  }

  if (!turnstileToken) {
    return nextState(
      previousState,
      "error",
      "Selesaikan verifikasi keamanan sebelum masuk.",
    );
  }

  const turnstile = await verifyTurnstile(turnstileToken);

  if (!turnstile.ok) {
    return nextState(previousState, "error", turnstile.message);
  }

  // Integrasi kredensial dan sesi akan disambungkan ke penyedia autentikasi
  // setelah kontrak backend final diputuskan. Kata sandi tidak disimpan di sini.
  return nextState(
    previousState,
    "info",
    "Verifikasi keamanan berhasil. Layanan akun siap disambungkan ke backend autentikasi.",
  );
}
