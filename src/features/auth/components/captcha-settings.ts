import { publicEnv } from "@/lib/config/public-env";

// Pengaturan captcha yang sama untuk formulir daftar dan lupa sandi.

export const isCaptchaEnabled = Boolean(
  publicEnv.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY?.trim(),
);

export const captchaRequiredMessage =
  "Selesaikan verifikasi keamanan terlebih dahulu.";
