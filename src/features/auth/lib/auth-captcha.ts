import {
  getCaptchaProvider,
  getCaptchaSecretKey,
  isProductionLikeEnvironment,
} from "./auth-config";

type CaptchaResult =
  | { ok: true; enforced: boolean }
  | { ok: false; enforced: boolean; error: string };

type TurnstileResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export async function verifyCaptchaToken({
  token,
  remoteIp,
}: {
  token: string | null;
  remoteIp: string | null;
}): Promise<CaptchaResult> {
  const provider = getCaptchaProvider();

  if (provider === "disabled") {
    return { ok: true, enforced: false };
  }

  if (provider !== "turnstile") {
    return {
      ok: false,
      enforced: true,
      error: "Provider verifikasi keamanan tidak dikenali.",
    };
  }

  const secret = getCaptchaSecretKey();

  if (!secret) {
    return {
      ok: false,
      enforced: true,
      error: "Verifikasi keamanan belum dikonfigurasi.",
    };
  }

  if (!token) {
    return {
      ok: false,
      enforced: true,
      error: "Selesaikan verifikasi keamanan terlebih dahulu.",
    };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      enforced: true,
      error: "Verifikasi keamanan belum bisa diproses.",
    };
  }

  const payload = (await response.json()) as TurnstileResponse;

  if (payload.success) {
    return { ok: true, enforced: true };
  }

  const isMissingInput =
    payload["error-codes"]?.includes("missing-input-response") ?? false;

  return {
    ok: false,
    enforced: true,
    error:
      isMissingInput && !isProductionLikeEnvironment()
        ? "Token verifikasi keamanan kosong. Nonaktifkan AUTH_CAPTCHA_PROVIDER untuk development lokal."
        : "Verifikasi keamanan tidak valid.",
  };
}
