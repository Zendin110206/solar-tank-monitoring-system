# Reviewer Quickstart

Dokumen ini untuk orang yang ingin mengecek repo dengan cepat.

## 1. Clone dan Install

Pastikan sudah ada:

- Git;
- Node.js 20 atau lebih baru;
- pnpm 9.x.

Jika `pnpm` belum tersedia:

```powershell
corepack enable
corepack prepare pnpm@9.15.3 --activate
```

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
pnpm install
```

## 2. Jalankan Aplikasi

```powershell
pnpm dev
```

Buka:

```text
http://localhost:3000
```

Halaman yang bisa dilihat:

| URL | Isi |
|---|---|
| `/` | landing page |
| `/login` | login pengguna |
| `/register` | pengajuan akses pengguna baru |
| `/forgot-password` | permintaan reset kata sandi |
| `/dashboard` | monitoring operasional tangki |
| `/dashboard/ringkas/tanks/tank-tph-main` | detail operasional tangki contoh |
| `/dashboard/detail` | analisis teknis khusus admin |
| `/dashboard/admin/users` | manajemen pengguna khusus admin |
| `/dashboard/admin/audit` | audit keamanan auth khusus admin |

## 3. Cek Aplikasi dan Storage

Cek aplikasi hidup:

```powershell
curl.exe http://localhost:3000/api/health
```

Cek storage aktif siap:

```powershell
curl.exe http://localhost:3000/api/ready
```

Jika mode default `memory` dipakai, `/api/ready` tetap sukses tetapi statusnya
`degraded` karena data memory tidak permanen. Jika mode `mysql` dipakai dan
database belum siap, `/api/ready` akan mengembalikan HTTP `503`.

## 4. Jalankan Pengecekan

```powershell
pnpm check
```

Perintah ini menjalankan:

```text
typecheck -> lint -> test -> build
```

## 5. Coba Simulator Memory Mode

Pastikan dev server masih berjalan.

Di terminal lain:

```powershell
pnpm simulate:device --device demo-tph-01 --start-percent 73 --once
```

Output yang diharapkan:

```text
[simulator] terkirim demo-tph-01 | 73% | 3650 L | jarak 40.5 cm | HTTP 201
```

Simulator otomatis memakai key demo sesuai device. Jika ingin mengisi key manual:

```powershell
pnpm simulate:device --device demo-tph-01 --key demo-tph-key --once
```

## 6. Cek API Detail

```powershell
curl.exe http://localhost:3000/api/tanks/tank-tph-main
```

Cari nilai:

```text
fillPercent = 73
volumeLiter = 3650
```

## 7. Cek History

```powershell
curl.exe "http://localhost:3000/api/tanks/tank-tph-main/readings?range=24h"
```

History harus bertambah setelah simulator mengirim data.

## 8. Hal yang Perlu Dipahami Reviewer

- UI dashboard/detail membaca storage aktif yang sama dengan endpoint API.
- `/api/health` hanya mengecek aplikasi hidup.
- `/api/ready` mengecek apakah storage aktif siap dipakai.
- Mode MySQL membaca registry site, tangki, device, dan hash key dari database.
- Registry pilot bisa disiapkan lewat `pnpm pilot:registry`, tetapi file real harus lokal dan tidak boleh masuk Git.
- Smoke test payload real-format bisa dikirim lewat `pnpm pilot:smoke`.
- Login/register sudah terhubung ke auth database jika migration auth dan admin awal sudah disiapkan.
- Pengajuan akses user baru masuk status pending dan harus ditinjau admin.
- Form publik dapat dilindungi Cloudflare Turnstile jika `AUTH_CAPTCHA_PROVIDER="turnstile"` dan key lengkap.
- OTP admin, verifikasi email, serta reset password membutuhkan SMTP atau dev log non-production yang diizinkan.
- API sudah bisa menerima data simulator.
- Saat server baru berjalan, memory mode menyiapkan data demo dengan timestamp relatif agar dashboard tidak langsung terlihat basi.
- Memory store hilang ketika server restart.
- MySQL mode tersedia untuk latihan persistent reading, tetapi belum berarti production-ready.
- Key per device sudah divalidasi memakai hash pada data contoh development.
- Data real hanya boleh dipakai lewat file lokal/env yang tidak di-commit.
- Repo tidak boleh memuat credential atau data internal.

## 9. Coba Mode MySQL Jika Database Tersedia

Mode default tetap `memory`. Jika reviewer punya database MySQL lokal atau cloud
khusus demo, isi `.env.local`:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://user:password@host:port/database"
MYSQL_CONNECTION_LIMIT="2"
MYSQL_SSL_MODE="disabled"
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"
AUTH_SECRET="ganti-dengan-secret-minimal-32-karakter"
AUTH_REQUIRE_ADMIN_OTP="true"
AUTH_ENABLE_REGISTER="true"
AUTH_ALLOW_PASSWORD_RESET="true"
AUTH_CAPTCHA_PROVIDER="disabled"
```

Untuk cloud MySQL yang mewajibkan TLS, gunakan:

```env
MYSQL_SSL_MODE="required"
```

Jika provider memberi CA certificate, isi `MYSQL_SSL_CA`.

Jalankan migration dan seed:

```powershell
pnpm db:setup:mysql
pnpm auth:create-admin
```

Jika database sudah pernah dibuat sebelum field operasional pengajuan perangkat
tersedia, jalankan juga migration berikut agar schema lama tetap kompatibel:

```powershell
pnpm db:migrate:device-provisioning
pnpm db:migrate:device-request-fields
pnpm db:migrate:reading-rollup
```

Setelah mengubah `.env.local`, restart `pnpm dev`, lalu cek:

```powershell
curl.exe http://localhost:3000/api/ready
```

## 10. Coba Alur Pilot Jika Data Sudah Disetujui

Bagian ini hanya untuk reviewer yang memang punya data pilot yang boleh dipakai.
Jangan memakai koordinat, key, atau connection string asli di file yang akan
di-commit.

```powershell
pnpm db:migrate:mysql
pnpm pilot:hash-key
Copy-Item config/pilot-registry.example.json config/pilot-registry.local.json
```

Setelah itu edit `config/pilot-registry.local.json`:

- isi 5 STO yang disetujui;
- ganti `coordinateStatus` menjadi `approved`;
- isi hash key device dari `pnpm pilot:hash-key`;
- pastikan kapasitas dan dimensi tangki sesuai data yang dipakai.

Validasi tanpa menulis database:

```powershell
pnpm pilot:registry -- --dry-run
```

Jika sudah sukses:

```powershell
pnpm pilot:registry
```

Smoke test:

```powershell
$env:PILOT_API_BASE_URL="http://localhost:3000"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device"
pnpm pilot:smoke
```

## 11. Jika Ada Error

Jika `pnpm simulate:device` gagal:

- pastikan `pnpm dev` berjalan;
- pastikan port `3000` benar;
- pastikan key sesuai device, misalnya `demo-tph-key` untuk `demo-tph-01`;
- jika memakai fallback global, pastikan `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` tidak diset ke `false`;
- coba `pnpm simulate:device --help`.

Jika dashboard menampilkan "Data monitoring belum bisa dibaca":

- buka `http://localhost:3000/api/ready`;
- jika `/api/ready` HTTP `503`, cek `MYSQL_DATABASE_URL`, status database,
  SSL/allowlist provider, dan koneksi jaringan;
- jika baru mengubah `.env.local`, hentikan lalu jalankan ulang `pnpm dev`.

Jika `pnpm check` gagal:

- baca error pertama;
- jangan push sebelum diperbaiki;
- jalankan ulang setelah perbaikan.
