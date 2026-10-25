// Variabel lingkungan yang memang boleh terlihat di browser (awalan NEXT_PUBLIC_).
// Next.js menyalin nilainya ke kode browser saat build, jadi nama variabel harus ditulis
// lengkap seperti di bawah. Jangan menaruh rahasia di sini; rahasia ada di server-env.ts.
export const publicEnv = {
  /** "production" menandai lingkungan produksi. */
  get NEXT_PUBLIC_APP_ENV() {
    return process.env.NEXT_PUBLIC_APP_ENV;
  },
  /** Kunci situs captcha Turnstile untuk formulir publik. */
  get NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY() {
    return process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY;
  },
  /** Jeda muat ulang data dashboard dalam milidetik. */
  get NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL_MS() {
    return process.env.NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL_MS;
  },
};
