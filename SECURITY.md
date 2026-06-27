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
- device harus terdaftar di data dummy;
- device tidak aktif ditolak;
- payload device yang tidak sesuai header ditolak;
- hash key per device pada data dummy;
- fallback key global bisa dimatikan lewat `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"`;
- data bisa disimpan di memory store lokal atau MySQL reading repository.

Yang belum ada:

- rate limit;
- audit log;
- autentikasi user;
- role-based access control;
- registry device dan key yang sepenuhnya dikelola database;
- database production dengan backup;
- HTTPS produksi;
- rotasi key;
- monitoring server.

## Pelaporan Masalah Keamanan

Jika menemukan masalah keamanan:

1. Jangan membuka issue publik yang berisi secret atau cara eksploitasi detail.
2. Hubungi pemelihara secara privat.
3. Sertakan langkah reproduksi tanpa membagikan credential asli.
4. Jika ada file sensitif terlanjur masuk Git, hentikan push tambahan dan lakukan pembersihan history dengan hati-hati.

## Checklist Sebelum Deployment

Sebelum deployment nyata:

- ganti key dummy;
- simpan secret di environment;
- matikan fallback global device key;
- aktifkan HTTPS;
- batasi akses dashboard;
- tambah rate limit untuk endpoint ingest;
- gunakan database dengan backup;
- pisahkan role user;
- siapkan audit log;
- validasi payload device;
- review konfigurasi server.

## Branch yang Didukung

Untuk fase saat ini, perbaikan keamanan diarahkan ke branch `main`.
