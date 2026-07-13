# Kebijakan Keamanan

Repositori ini bersifat public-safe. Artinya, semua contoh data, payload, konfigurasi, dan dokumentasi harus aman jika dibaca publik.

## Jangan Commit Data Rahasia

Jangan pernah commit:

- API key asli;
- token deployment;
- password database;
- file `.env.local`;
- credential WiFi;
- private key;
- domain produksi;
- alamat IP internal;
- payload telemetry real;
- data lokasi sensitif;
- backup database;
- konfigurasi server privat;
- screenshot yang berisi informasi internal.

Gunakan `.env.example` hanya untuk nama variabel dan nilai dummy.

## Key Device Lokal

Untuk development lokal, API ingest dapat memakai key demo per device. Contoh:

```text
demo-tph-01 -> demo-tph-key
demo-nja-01 -> demo-nja-key
demo-jto-01 -> demo-jto-key
demo-skp-01 -> demo-skp-key
```

Key tersebut hanya contoh. Jangan gunakan untuk production.

Fallback global `local-development-key` masih tersedia untuk latihan awal jika belum dimatikan. Jika ingin mengganti key fallback lokal:

```powershell
$env:SOLAR_TANK_LOCAL_DEVICE_KEY="ganti-dengan-key-lokal"
pnpm dev
```

Lalu simulator dijalankan dengan key yang sama:

```powershell
pnpm simulate:device --key ganti-dengan-key-lokal --once
```

## Batas Keamanan Saat Ini

Yang sudah ada:

- API ingest mengecek `X-Device-Id`;
- API ingest mengecek `X-Api-Key` atau `X-Device-Key`;
- device harus terdaftar di data contoh development;
- device tidak aktif ditolak;
- payload device yang tidak sesuai header ditolak;
- hash key per device pada data contoh development;
- fallback key global bisa dimatikan lewat `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"`;
- data bisa disimpan di memory store lokal atau MySQL reading repository.
- login pengguna berbasis database MySQL;
- session disimpan sebagai token hash di database dan cookie browser memakai `httpOnly`, `sameSite=lax`, serta `secure` saat environment production;
- role `admin` dan `user` dipakai untuk membatasi halaman admin;
- password memakai Argon2id dan hash legacy ditandai untuk upgrade;
- login admin dapat diwajibkan memakai OTP email;
- pengajuan akses publik masuk status pending dan harus direview admin;
- verifikasi email, reset password, dan perubahan password memakai token sekali pakai berbasis hash;
- form publik bisa dilindungi Cloudflare Turnstile melalui `AUTH_CAPTCHA_PROVIDER="turnstile"`;
- rate limit tersedia untuk login, pengajuan akses, lupa password, dan pengiriman ulang verifikasi email;
- endpoint ingest memiliki rate limit saat storage MySQL aktif;
- audit event auth mencatat login, OTP, reset password, verifikasi email, perubahan role, aktivasi/nonaktif akun, dan aksi sesi;
- halaman keamanan akun tersedia untuk ganti kata sandi, melihat sesi aktif, mencabut sesi lain, dan binding Telegram.
- alur pengajuan perangkat membuat device key dan firmware package setelah admin approve;
- paket firmware disimpan terenkripsi dan didownload lewat token terbatas;
- device baru tidak aktif sebelum first valid ping dengan key yang cocok;
- admin cleanup data device/uji tidak menghapus akun user/admin, template firmware, atau hardware profile.

Yang belum ada:

- proteksi request tambahan di perimeter/CDN pada deployment final;
- rotasi key device dari UI admin;
- manajemen registry site/tangki/device yang menulis database dari UI;
- database production dengan backup;
- HTTPS produksi;
- monitoring server.
- prosedur recovery akun dan database yang sudah diuji berkala;
- hardening perimeter deployment final.
- approval/reject device request lewat Telegram.

## Pelaporan Masalah Keamanan

Jika menemukan masalah keamanan:

1. Jangan membuka issue publik yang berisi secret atau cara eksploitasi detail.
2. Hubungi pemelihara secara privat.
3. Sertakan langkah reproduksi tanpa membagikan credential asli.
4. Jika ada file sensitif terlanjur masuk Git, hentikan push tambahan dan lakukan pembersihan history dengan hati-hati.

## Checklist Sebelum Deployment

Sebelum deployment nyata:

- ganti key contoh;
- simpan secret di environment;
- matikan fallback global device key;
- jalankan semua migration database monitoring dan auth;
- buat admin awal lewat `pnpm auth:create-admin`;
- isi `AUTH_SECRET` minimal 32 karakter;
- aktifkan SMTP untuk OTP admin, verifikasi email, dan reset password;
- aktifkan Turnstile untuk form publik dan pastikan site key serta secret key berasal dari widget yang sama;
- set `AUTH_COOKIE_SECURE="true"` pada domain HTTPS;
- aktifkan HTTPS;
- batasi akses halaman admin hanya untuk role admin;
- pastikan endpoint ingest berjalan pada mode MySQL sehingga rate limit aplikasi aktif;
- pastikan environment final memiliki TLS, timeout, payload limit, dan logging pada perimeter yang disepakati;
- gunakan database dengan backup;
- uji restore backup database;
- review audit log keamanan secara berkala;
- validasi payload device;
- review konfigurasi server.

## Branch yang Didukung

Untuk fase saat ini, perbaikan keamanan diarahkan ke branch `main`.
