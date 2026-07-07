# Deployment

Dokumen ini menjelaskan status deployment dan opsi yang mungkin dipakai nanti.

## Status Saat Ini

Saat ini aplikasi belum dideploy sebagai sistem produksi.

Yang sudah aman dilakukan:

- menjalankan aplikasi lokal;
- menjalankan simulator lokal;
- menguji API lokal;
- mengecek aplikasi hidup lewat `/api/health`;
- mengecek kesiapan storage aktif lewat `/api/ready` memakai session admin atau token operasional di production;
- menguji mode memory store;
- menyiapkan migration dan seed MySQL untuk latihan registry monitoring dan persistent storage;
- menjalankan setup MySQL lewat `pnpm db:setup:mysql`;
- membuat hash key device pilot lewat `pnpm pilot:hash-key`;
- memvalidasi dan apply registry pilot lokal lewat `pnpm pilot:registry`;
- mengirim smoke payload real-format lewat `pnpm pilot:smoke`;
- membuat backup MySQL manual lewat `pnpm db:backup:mysql`;
- menjalankan migration auth lewat `pnpm db:migrate:auth` dan `pnpm db:migrate:auth-recovery`;
- membuat admin awal lewat `pnpm auth:create-admin`;
- menguji login, pengajuan akses, verifikasi email, reset password, dan halaman admin jika env auth lengkap;
- menjalankan `pnpm check`;
- membangun production build lokal.

Yang belum final:

- database production dengan backup dan SOP restore;
- domain production final;
- HTTPS production final di server pilihan akhir;
- konfigurasi auth production final, termasuk SMTP, CAPTCHA, session secret, dan cookie secure;
- backup;
- monitoring server;
- integrasi device fisik yang sudah divalidasi lapangan.

Untuk status operasional terbaru, baca juga:

```text
docs/current-operational-truth.md
docs/database-backup.md
```

## Menjalankan Lokal

```powershell
pnpm install
pnpm dev
```

Buka:

```text
http://localhost:3000
```

Cek aplikasi hidup:

```powershell
curl.exe http://localhost:3000/api/health
```

Cek storage aktif:

```powershell
curl.exe http://localhost:3000/api/ready
```

Perbedaan penting:

```text
/api/health hanya membuktikan aplikasi hidup.
/api/ready membuktikan storage aktif siap dan berisi detail operasional. Di production,
akses endpoint ini hanya untuk admin yang login atau request dengan header
`x-solar-tank-readiness-token`.
```

Jika `/api/health` sukses tetapi `/api/ready` gagal, biasanya masalah ada pada
database, connection string, SSL, allowlist, atau jaringan.

Build lokal:

```powershell
pnpm build
pnpm start
```

Jika ingin mencoba storage MySQL lokal atau cloud, isi `.env.local` dengan `MYSQL_DATABASE_URL`, jalankan `pnpm db:setup:mysql`, lalu set `SOLAR_TANK_STORAGE_DRIVER="mysql"`.

Setelah mengubah `.env.local`, restart `pnpm dev`. Perubahan environment tidak
selalu terbaca hanya dengan menekan tombol refresh dashboard.

## Pilot Vercel + Cloud MySQL

Untuk pilot ringan, alur sementara yang didukung:

```text
Device real atau smoke test
  -> Vercel URL
  -> /api/ingest
  -> Cloud MySQL
  -> dashboard/detail
```

Environment di Vercel harus diisi lewat dashboard Vercel, bukan file Git:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"
MYSQL_DATABASE_URL="mysql://..."
MYSQL_CONNECTION_LIMIT="1"
MYSQL_SSL_MODE="required"
AUTH_SECRET="..."
AUTH_REQUIRE_ADMIN_OTP="true"
AUTH_ENABLE_REGISTER="true"
AUTH_ALLOW_PASSWORD_RESET="true"
AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_APPROVAL="true"
AUTH_COOKIE_SECURE="true"
APP_BASE_URL="https://solar-tank-monitoring-system.vercel.app"
DEVICE_PACKAGE_ENCRYPTION_KEY="..."
DEVICE_PACKAGE_DOWNLOAD_TTL_DAYS="7"
DEVICE_PACKAGE_MAX_DOWNLOADS="3"
AUTH_CAPTCHA_PROVIDER="turnstile"
NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY="..."
AUTH_CAPTCHA_SECRET_KEY="..."
SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="SolarTank <noreply@example.com>"
SMTP_SECURE="false"
```

Jika provider memberi CA certificate, isi `MYSQL_SSL_CA` di environment Vercel.
Pastikan `APP_BASE_URL` memakai domain aplikasi yang benar. Production tidak
boleh memakai localhost karena URL ini dipakai untuk link verifikasi email dan
reset password. `AUTH_CAPTCHA_PROVIDER` hanya menerima `disabled` atau
`turnstile`; salah ketik akan membuat readiness gagal supaya masalah terlihat
sebelum dipakai user.

`DEVICE_PACKAGE_ENCRYPTION_KEY` wajib diisi di production karena paket firmware
disimpan terenkripsi. Buat nilainya sekali, simpan di password manager, lalu
pakai nilai yang sama selama paket firmware lama masih perlu bisa dibuka.
Contoh membuat key dari terminal:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Langkah pilot:

```powershell
pnpm db:setup:mysql
pnpm pilot:hash-key
Copy-Item config/pilot-registry.example.json config/pilot-registry.local.json
# edit config/pilot-registry.local.json sampai koordinat dan hash device sudah real/approved
pnpm pilot:registry -- --dry-run
pnpm pilot:registry
$env:PILOT_API_BASE_URL="https://solar-tank-monitoring-system.vercel.app"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device"
pnpm pilot:smoke
```

Jika database production sudah ada dan tidak boleh di-seed ulang, jangan pakai
`pnpm db:setup:mysql`. Jalankan migration satu per satu, lalu apply registry
yang memang sudah disetujui:

```powershell
pnpm db:migrate:mysql
pnpm db:migrate:auth
pnpm db:migrate:auth-recovery
pnpm db:migrate:device-provisioning
pnpm db:migrate:device-request-fields
```

Catatan:

- `config/pilot-registry.local.json` tidak boleh di-commit;
- `config/pilot-registry.example.json` hanya template aman dan sengaja belum memakai koordinat/hash final;
- key asli device tidak boleh masuk repo;
- fallback global key harus `false` untuk pilot;
- jika `/api/ready` gagal, jangan lanjut uji device sebelum storage diperbaiki;
- setelah mengubah env Vercel, lakukan redeploy.

## Opsi Deployment Demo

Untuk demo tanpa data sensitif, aplikasi bisa diarahkan ke platform seperti Vercel.

Syarat:

- hanya data dummy;
- tidak ada credential asli;
- tidak ada payload real;
- tidak ada lokasi sensitif;
- env var diisi lewat dashboard platform, bukan file Git.

Kelebihan:

- mudah dibuka reviewer;
- cepat untuk validasi tampilan;
- cocok untuk demo awal.

Batasan:

- tidak otomatis cocok untuk perangkat lapangan;
- memory store tidak stabil di serverless;
- perlu database jika ingin history bertahan.
- `/api/ready` harus sukses sebelum URL demo dianggap siap dipakai reviewer. Jangan
  membuka endpoint ini sebagai URL publik tanpa session admin atau token readiness.

## Environment Variable

Jangan upload `.env.local`.

Gunakan `.env.example` sebagai referensi nama variabel.

Variabel utama saat ini:

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL_MS
SOLAR_TANK_STORAGE_DRIVER
SOLAR_TANK_LOCAL_DEVICE_KEY
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK
SOLAR_TANK_DEVICE_KEY
MYSQL_DATABASE_URL
MYSQL_CONNECTION_LIMIT
MYSQL_SSL_MODE
MYSQL_SSL_CA
DEVICE_PACKAGE_ENCRYPTION_KEY
DEVICE_PACKAGE_DOWNLOAD_TTL_DAYS
DEVICE_PACKAGE_MAX_DOWNLOADS
AUTH_SESSION_COOKIE_NAME
AUTH_SECRET
AUTH_REQUIRE_ADMIN_OTP
AUTH_ENABLE_REGISTER
AUTH_ALLOW_PASSWORD_RESET
AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_APPROVAL
AUTH_COOKIE_SECURE
APP_BASE_URL
AUTH_BOOTSTRAP_ADMIN_EMAIL
AUTH_BOOTSTRAP_ADMIN_USERNAME
AUTH_BOOTSTRAP_ADMIN_FULL_NAME
AUTH_BOOTSTRAP_ADMIN_PASSWORD
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
SMTP_SECURE
AUTH_CAPTCHA_PROVIDER
NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY
AUTH_CAPTCHA_SECRET_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_BOT_USERNAME
```

## Checklist Sebelum Production

- Database sudah tersedia.
- Secret tidak ada di Git.
- Migration monitoring dan auth sudah dijalankan.
- Admin awal sudah dibuat.
- SMTP sudah diuji untuk OTP admin, verifikasi email, dan reset password.
- Turnstile sudah aktif untuk form publik dan domain production sudah terdaftar di Cloudflare.
- API key device tidak memakai dummy key.
- Fallback global device key dimatikan.
- HTTPS aktif.
- Endpoint ingest punya rate limit.
- User login, role, approval admin, dan deaktivasi akun sudah diuji.
- Backup database disiapkan.
- Registry site, tank, device, dan key berasal dari database yang dikelola.
- Rumus volume sudah dikalibrasi.
- Device fisik diuji aman.
- Data yang ditampilkan sudah disetujui.
- `/api/health` mengembalikan HTTP 200.
- `/api/ready` mengembalikan HTTP 200 untuk storage production/pilot.

## Catatan Penting

Memory store saat ini hanya untuk development.

Jika server restart, data hasil simulator hilang.

Untuk deployment yang perlu history, storage harus memakai database. Fondasi MySQL sudah tersedia untuk registry monitoring, reading, dan auth. Production tetap membutuhkan SMTP, Turnstile, HTTPS, backup/restore, rate limit ingest, rotasi key device, monitoring server, dan prosedur operasional. Detail deployment pilihan akhir ditunda sampai keputusan tim berikutnya.
