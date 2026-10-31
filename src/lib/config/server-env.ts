import "server-only";

// Katalog semua variabel lingkungan yang dibaca aplikasi di server.
// Kode lain membaca pengaturan dari sini, bukan dari process.env langsung (dicek ESLint).
// Setiap nilai dibaca saat dipakai (getter), sama seperti membaca process.env langsung,
// sehingga perubahan nilai saat tes tetap terbaca. Contoh nilai ada di .env.example.
// Nilai yang boleh terlihat di browser (NEXT_PUBLIC_*) ada di public-env.ts.
export const serverEnv = {
  // Lingkungan aplikasi
  /** Diisi Next.js: "development", "production", atau "test". */
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },
  // Penyimpanan data
  /** "mysql" memakai database; selain itu data contoh di memori. */
  get SOLAR_TANK_STORAGE_DRIVER() {
    return process.env.SOLAR_TANK_STORAGE_DRIVER;
  },
  /** Alamat koneksi MySQL (berisi kata sandi). */
  get MYSQL_DATABASE_URL() {
    return process.env.MYSQL_DATABASE_URL;
  },
  /** Batas koneksi pool MySQL. */
  get MYSQL_CONNECTION_LIMIT() {
    return process.env.MYSQL_CONNECTION_LIMIT;
  },
  /** "required" untuk koneksi aman ke database cloud. */
  get MYSQL_SSL_MODE() {
    return process.env.MYSQL_SSL_MODE;
  },
  /** Sertifikat CA penyedia database (baris baru ditulis \n). */
  get MYSQL_SSL_CA() {
    return process.env.MYSQL_SSL_CA;
  },
  /** Folder hasil backup MySQL (dicek oleh /api/ready). */
  get MYSQL_BACKUP_OUTPUT_DIR() {
    return process.env.MYSQL_BACKUP_OUTPUT_DIR;
  },
  /** Lama simpan backup dalam hari (dicek oleh /api/ready). */
  get MYSQL_BACKUP_RETENTION_DAYS() {
    return process.env.MYSQL_BACKUP_RETENTION_DAYS;
  },
  // Perangkat dan penerimaan data
  /** Kunci global untuk latihan lokal POST /api/ingest. */
  get SOLAR_TANK_LOCAL_DEVICE_KEY() {
    return process.env.SOLAR_TANK_LOCAL_DEVICE_KEY;
  },
  /** Izinkan kunci global bila perangkat belum punya kunci sendiri. */
  get SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK() {
    return process.env.SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK;
  },
  /** Buat lokasi/tangki/perangkat baru otomatis dari kiriman perangkat. */
  get SOLAR_TANK_AUTO_PROVISION_DEVICES() {
    return process.env.SOLAR_TANK_AUTO_PROVISION_DEVICES;
  },
  /** Kunci X-Provisioning-Key untuk pembuatan otomatis. */
  get SOLAR_TANK_DEVICE_PROVISIONING_KEY() {
    return process.env.SOLAR_TANK_DEVICE_PROVISIONING_KEY;
  },
  /** Kunci enkripsi paket firmware (wajib di produksi). */
  get DEVICE_PACKAGE_ENCRYPTION_KEY() {
    return process.env.DEVICE_PACKAGE_ENCRYPTION_KEY;
  },
  /** Masa berlaku tautan unduh paket dalam hari. */
  get DEVICE_PACKAGE_DOWNLOAD_TTL_DAYS() {
    return process.env.DEVICE_PACKAGE_DOWNLOAD_TTL_DAYS;
  },
  /** Batas jumlah unduhan satu paket. */
  get DEVICE_PACKAGE_MAX_DOWNLOADS() {
    return process.env.DEVICE_PACKAGE_MAX_DOWNLOADS;
  },
  // Akun, sesi, dan keamanan
  /** Alamat aplikasi untuk tautan di email. */
  get APP_BASE_URL() {
    return process.env.APP_BASE_URL;
  },
  /** Rahasia penanda sesi dan token. */
  get AUTH_SECRET() {
    return process.env.AUTH_SECRET;
  },
  /** Nama cookie sesi. */
  get AUTH_SESSION_COOKIE_NAME() {
    return process.env.AUTH_SESSION_COOKIE_NAME;
  },
  /** Paksa cookie hanya lewat HTTPS ("true"/"false"). */
  get AUTH_COOKIE_SECURE() {
    return process.env.AUTH_COOKIE_SECURE;
  },
  /** Lama sesi petugas dalam detik. */
  get AUTH_SESSION_TTL_SECONDS() {
    return process.env.AUTH_SESSION_TTL_SECONDS;
  },
  /** Lama sesi admin dalam detik. */
  get AUTH_ADMIN_SESSION_TTL_SECONDS() {
    return process.env.AUTH_ADMIN_SESSION_TTL_SECONDS;
  },
  /** Jeda pembaruan waktu terakhir aktif sesi. */
  get AUTH_SESSION_LAST_SEEN_UPDATE_SECONDS() {
    return process.env.AUTH_SESSION_LAST_SEEN_UPDATE_SECONDS;
  },
  /** Wajibkan kode OTP email untuk login admin. */
  get AUTH_REQUIRE_ADMIN_OTP() {
    return process.env.AUTH_REQUIRE_ADMIN_OTP;
  },
  /** Masa berlaku kode OTP dalam detik. */
  get AUTH_OTP_TTL_SECONDS() {
    return process.env.AUTH_OTP_TTL_SECONDS;
  },
  /** Di luar produksi, izinkan kode OTP ditulis ke log server. */
  get AUTH_ALLOW_DEV_OTP_LOG() {
    return process.env.AUTH_ALLOW_DEV_OTP_LOG;
  },
  /** Batas gagal login sebelum akun dikunci sementara. */
  get AUTH_LOGIN_MAX_ATTEMPTS() {
    return process.env.AUTH_LOGIN_MAX_ATTEMPTS;
  },
  /** Lama kunci akun setelah terlalu banyak gagal login. */
  get AUTH_LOGIN_LOCK_SECONDS() {
    return process.env.AUTH_LOGIN_LOCK_SECONDS;
  },
  /** Buka pendaftaran akun baru. */
  get AUTH_ENABLE_REGISTER() {
    return process.env.AUTH_ENABLE_REGISTER;
  },
  /** Izinkan atur ulang kata sandi lewat email. */
  get AUTH_ALLOW_PASSWORD_RESET() {
    return process.env.AUTH_ALLOW_PASSWORD_RESET;
  },
  /** Masa berlaku tautan atur ulang kata sandi. */
  get AUTH_PASSWORD_RESET_TTL_SECONDS() {
    return process.env.AUTH_PASSWORD_RESET_TTL_SECONDS;
  },
  /** Wajibkan email terverifikasi sebelum akun disetujui. */
  get AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_APPROVAL() {
    return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_APPROVAL;
  },
  /** Masa berlaku tautan verifikasi email. */
  get AUTH_EMAIL_VERIFICATION_TTL_SECONDS() {
    return process.env.AUTH_EMAIL_VERIFICATION_TTL_SECONDS;
  },
  /** "disabled" atau "turnstile". */
  get AUTH_CAPTCHA_PROVIDER() {
    return process.env.AUTH_CAPTCHA_PROVIDER;
  },
  /** Kunci rahasia captcha di server. */
  get AUTH_CAPTCHA_SECRET_KEY() {
    return process.env.AUTH_CAPTCHA_SECRET_KEY;
  },
  /** Token untuk membuka /api/ready tanpa login. */
  get READINESS_CHECK_TOKEN() {
    return process.env.READINESS_CHECK_TOKEN;
  },
  // Email (SMTP)
  /** Alamat server email. */
  get SMTP_HOST() {
    return process.env.SMTP_HOST;
  },
  /** Port server email (bawaan 587). */
  get SMTP_PORT() {
    return process.env.SMTP_PORT;
  },
  /** "true" untuk koneksi TLS langsung. */
  get SMTP_SECURE() {
    return process.env.SMTP_SECURE;
  },
  /** Nama pengguna server email. */
  get SMTP_USER() {
    return process.env.SMTP_USER;
  },
  /** Kata sandi server email. */
  get SMTP_PASS() {
    return process.env.SMTP_PASS;
  },
  /** Alamat pengirim email. */
  get SMTP_FROM() {
    return process.env.SMTP_FROM;
  },
  // Telegram
  /** Token bot Telegram. */
  get TELEGRAM_BOT_TOKEN() {
    return process.env.TELEGRAM_BOT_TOKEN;
  },
  /** Nama bot Telegram (tanpa @). */
  get TELEGRAM_BOT_USERNAME() {
    return process.env.TELEGRAM_BOT_USERNAME;
  },
  /** Rahasia untuk memeriksa webhook Telegram. */
  get TELEGRAM_WEBHOOK_SECRET() {
    return process.env.TELEGRAM_WEBHOOK_SECRET;
  },
  /** Grup admin untuk notifikasi (opsional). */
  get TELEGRAM_ADMIN_GROUP_CHAT_ID() {
    return process.env.TELEGRAM_ADMIN_GROUP_CHAT_ID;
  },
  /** Topik grup untuk akun baru (opsional). */
  get TELEGRAM_TOPIC_NEW_ACCOUNT_THREAD_ID() {
    return process.env.TELEGRAM_TOPIC_NEW_ACCOUNT_THREAD_ID;
  },
  /** Topik grup untuk perangkat baru (opsional). */
  get TELEGRAM_TOPIC_NEW_DEVICE_THREAD_ID() {
    return process.env.TELEGRAM_TOPIC_NEW_DEVICE_THREAD_ID;
  },
  /** Topik grup untuk bantuan web (opsional). */
  get TELEGRAM_TOPIC_LIVE_CHAT_THREAD_ID() {
    return process.env.TELEGRAM_TOPIC_LIVE_CHAT_THREAD_ID;
  },
  /** Topik grup untuk pesan sistem (opsional). */
  get TELEGRAM_TOPIC_SYSTEM_THREAD_ID() {
    return process.env.TELEGRAM_TOPIC_SYSTEM_THREAD_ID;
  },
  /** Masa berlaku kode penghubung akun ke Telegram. */
  get AUTH_TELEGRAM_BIND_TTL_SECONDS() {
    return process.env.AUTH_TELEGRAM_BIND_TTL_SECONDS;
  },
};

export type ServerEnvName = keyof typeof serverEnv;
