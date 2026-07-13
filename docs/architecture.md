# Arsitektur Sistem

Dokumen ini menjelaskan gambaran arsitektur FTM (Fuel Tank Management) dalam bahasa yang mudah diikuti.

## Ringkasan

Aplikasi ini dirancang sebagai sistem monitoring berbasis web.

Alur sederhananya:

```text
Device atau simulator
  -> API ingest
  -> normalisasi data
  -> storage aktif
  -> API baca
  -> dashboard web
```

Dashboard tidak membaca sensor secara langsung. Device atau simulator yang mengirim data ke server.

## Komponen Saat Ini

| Komponen | Lokasi | Status |
|---|---|---|
| Landing page | `src/app/page.tsx` | Ada |
| Login | `src/app/login/page.tsx` dan `src/app/api/auth/login/route.ts` | Ada, membuat session database |
| Pengajuan akses | `src/app/register/page.tsx` dan `src/app/api/auth/register-request/route.ts` | Ada, pending approval admin dan bisa dilindungi Turnstile |
| Lupa/reset password | `src/app/forgot-password`, `src/app/reset-password`, dan API auth password | Ada, memakai token sekali pakai |
| Manajemen pengguna | `src/app/dashboard/admin/users/page.tsx` | Ada, khusus admin |
| Audit keamanan auth | `src/app/dashboard/admin/audit/page.tsx` | Ada, khusus admin |
| Keamanan akun | `src/app/dashboard/account/security/page.tsx` | Ada, session aktif, ganti password, dan Telegram binding |
| Monitoring operasional | `src/app/dashboard/page.tsx` | Ada, membaca storage aktif |
| Detail tangki | `src/app/dashboard/tanks/[tankId]/page.tsx` | Ada, membaca storage aktif |
| API health | `src/app/api/health/route.ts` | Ada, mengecek aplikasi hidup |
| API readiness | `src/app/api/ready/route.ts` | Ada, mengecek storage aktif |
| API overview | `src/app/api/dashboard/overview/route.ts` | Ada |
| API detail tangki | `src/app/api/tanks/[tankId]/route.ts` | Ada |
| API history tangki | `src/app/api/tanks/[tankId]/readings/route.ts` | Ada |
| API ingest | `src/app/api/ingest/route.ts` | Ada |
| Memory store | `src/features/monitoring/lib/telemetry-store.ts` | Ada untuk development lokal |
| MySQL reading repository | `src/features/monitoring/lib/mysql-reading-repository.ts` | Ada, opsional |
| MySQL reference repository | `src/features/monitoring/lib/mysql-reference-repository.ts` | Ada, registry site/tangki/device |
| Storage facade | `src/features/monitoring/lib/monitoring-storage.ts` | Ada |
| Monitoring registry | `src/features/monitoring/lib/monitoring-registry.ts` | Ada, memilih registry memory atau MySQL |
| Device key validation | `src/features/monitoring/lib/device-key.ts` | Ada |
| Payload config review | `src/features/monitoring/lib/reading-tank-config.ts` | Ada, membandingkan config payload vs registry |
| Auto-refresh UI | `src/features/monitoring/components/live-refresh-control.tsx` | Ada |
| Jam real-time | `src/features/monitoring/components/live-clock.tsx` | Ada |
| Simulator | `scripts/simulate-device.mjs` | Ada |
| Pilot registry apply | `scripts/apply-pilot-registry.mjs` | Ada, membaca file lokal yang tidak di-commit |
| Pilot smoke ingest | `scripts/smoke-pilot-ingest.mjs` | Ada, mengirim payload real-format |
| Operational map | `src/features/monitoring/components/operational-map.tsx` | Ada, menampilkan marker dari latitude/longitude registry |
| Unit test | `src/features/monitoring/tests` | Ada |
| Unit test auth | `src/features/auth/tests` | Ada |

## Batas Frontend dan Backend

Frontend bertugas:

- menampilkan halaman;
- menampilkan form login, pengajuan akses, reset password, dan keamanan akun;
- menampilkan status dan angka yang sudah rapi;
- memberi pengalaman baca yang mudah;
- tidak menghitung hal operasional penting secara tersebar.

Backend/API bertugas:

- memberi sinyal aplikasi hidup melalui `/api/health`;
- memberi sinyal storage siap melalui `/api/ready`;
- menerima payload;
- memvalidasi device;
- memvalidasi key;
- menormalisasi payload;
- membaca config tangki dari payload sebagai snapshot;
- membandingkan snapshot payload dengan registry resmi;
- memberi status review jika config payload dan registry berbeda;
- menyediakan data siap baca untuk dashboard;
- membaca registry site, tangki, device, dan hash key dari memory atau MySQL sesuai mode storage;
- menangani autentikasi, session, role admin/user, OTP admin, reset password, verifikasi email, pengajuan akses, CAPTCHA form publik, dan audit auth;
- menyimpan data reading ke storage aktif.

## Alur Ingest

Ketika simulator dijalankan:

```powershell
pnpm simulate:device --once
```

yang terjadi:

```text
1. Simulator membuat payload.
2. Simulator POST ke /api/ingest.
3. API membaca header X-Device-Id.
4. API membaca X-Api-Key.
5. API mencari device di registry aktif, yaitu memory atau MySQL.
6. Payload dinormalisasi.
7. Reading disimpan ke storage aktif. Memory menambah reading biasa; MySQL menjalankan satu transaksi untuk meng-upsert snapshot live per device dan bucket history 5 menit.
8. Response HTTP 201 dikirim.
```

## Alur Baca

Endpoint baca mengambil data dari storage aktif:

```text
GET /api/health
GET /api/ready
GET /api/dashboard/overview
GET /api/tanks/[tankId]
GET /api/tanks/[tankId]/readings
```

Overview dan detail memakai aturan freshness yang sama. Repository mengambil
snapshot `monitoring_latest_readings` dan kandidat history terbaru, lalu memilih
`receivedAt` paling baru per tangki. Fallback history ini menjaga kompatibilitas
selama deployment lama masih menulis raw. Setelah writer baru aktif, snapshot
menjadi sumber live utama dan `monitoring_readings` menjadi history agregat.

`GET /api/health` tidak menyentuh database. Endpoint ini hanya memastikan
aplikasi hidup.

`GET /api/ready` mengecek storage aktif. Jika mode MySQL aktif dan koneksi
database gagal, endpoint ini mengembalikan HTTP 503 supaya masalah deployment
tidak tersembunyi di dashboard.

Saat dev server restart, memory store kembali ke data contoh awal yang waktunya digeser relatif ke waktu server start. Ini membuat demo awal tetap terbaca tanpa memakai data real. Jika mode MySQL aktif, registry site/tangki/device dibaca dari database dan reading disimpan di database selama database tetap tersedia.

## Data Contoh vs Data Real

Data contoh dipakai untuk:

- membangun UI;
- menguji status;
- menguji API;
- menguji simulator;
- menghindari penggunaan data sensitif.

Alat pilot sudah tersedia untuk memakai data real yang sudah disetujui. Data real tidak boleh ditaruh di repo. Registry real harus disimpan di file lokal seperti:

```text
config/pilot-registry.local.json
```

File lokal itu diabaikan Git.

Sebelum data real masuk, perlu validasi:

- izin penggunaan data;
- keamanan endpoint;
- dimensi tangki;
- posisi sensor;
- format payload final;
- deployment target.

## Alur Target Rollout Awal 5 STO

Kondisi terverifikasi per 13–14 Juli 2026 adalah 3 site, 3 tangki, dan 3
perangkat terdaftar. Bagian ini menjelaskan perluasan menuju target awal 5 STO,
bukan menyatakan lima lokasi sudah aktif.

Alur pilot yang disiapkan:

```text
config/pilot-registry.local.json
  -> pnpm pilot:registry
  -> MySQL registry
  -> device real atau pnpm pilot:smoke
  -> POST /api/ingest
  -> MySQL readings
  -> dashboard/detail
```

Registry pilot wajib memakai:

- minimal 5 site;
- koordinat yang sudah disetujui;
- hash key device, bukan key asli;
- dimensi tangki yang sudah dicek;
- fallback global key dimatikan.

Dashboard membaca `latitude` dan `longitude` dari registry site untuk marker
peta. Payload device boleh membawa data sensor dan config tangki, tetapi lokasi
STO tetap dikelola dari registry karena device saat ini tidak memakai GPS.

## Target Arsitektur Berikutnya

Kondisi fondasi monitoring saat ini:

```text
UI dashboard/detail
  -> storage facade
  -> monitoring registry memory atau MySQL
  -> memory store atau MySQL reading repository
  -> pilot registry lokal dapat diaplikasikan ke MySQL
  -> smoke payload real-format dapat dikirim ke API ingest
  -> peta koordinat membaca latitude/longitude registry
  -> berubah saat device/smoke mengirim data dan halaman di-refresh
```

Setelah fondasi auth tersedia, sisa pematangan production:

```text
SMTP real, Turnstile real, HTTPS, backup/restore, rate limit ingest, rotasi key device
  -> divalidasi sebelum production
```

Kondisi sekarang untuk auth:

```text
login/register/reset password
  -> API auth
  -> validasi payload, rate limit, CAPTCHA form publik bila aktif
  -> MySQL auth tables
  -> session cookie httpOnly
  -> halaman user/admin dibatasi role
```

Sisa pematangan sebelum production adalah environment production, SMTP real,
Turnstile real, backup/restore, HTTPS final, rate limit ingest, rotasi key
device, dan prosedur operasional.

## Prinsip Desain

- Gunakan API sebagai batas antara device dan dashboard.
- Simpan rumus di modul domain, bukan di komponen UI.
- Jangan menyimpan credential di repo.
- Jangan mengklaim production-ready sebelum deployment dan kalibrasi divalidasi.
- Buat dokumentasi cukup jelas agar kontributor baru bisa melanjutkan.
- Jangan menjadikan seluruh dashboard sebagai Client Component; gunakan client kecil hanya untuk interaksi seperti refresh dan jam.
