# Arsitektur Sistem

Dokumen ini menjelaskan gambaran arsitektur Solar Tank Monitoring System dalam bahasa yang mudah diikuti.

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
| Login | `src/app/login/page.tsx` | Ada, frontend-only |
| Pengajuan akses | `src/app/register/page.tsx` | Ada, frontend-only |
| Dashboard awal | `src/app/dashboard/page.tsx` | Ada, membaca storage aktif |
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
| Auto-refresh UI | `src/features/monitoring/components/live-refresh-control.tsx` | Ada |
| Jam real-time | `src/features/monitoring/components/live-clock.tsx` | Ada |
| Simulator | `scripts/simulate-device.mjs` | Ada |
| Unit test | `src/features/monitoring/tests` | Ada |

## Batas Frontend dan Backend

Frontend bertugas:

- menampilkan halaman;
- menyiapkan tampilan login dan pengajuan akses;
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
- menyediakan data siap baca untuk dashboard;
- membaca registry site, tangki, device, dan hash key dari memory atau MySQL sesuai mode storage;
- nanti menangani autentikasi dan persetujuan akses pengguna;
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
7. Reading disimpan ke storage aktif, yaitu memory atau MySQL.
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

Data real belum dipakai.

Sebelum data real masuk, perlu validasi:

- izin penggunaan data;
- keamanan endpoint;
- dimensi tangki;
- posisi sensor;
- format payload final;
- deployment target.

## Target Arsitektur Berikutnya

Kondisi setelah Batch 12:

```text
UI dashboard/detail
  -> storage facade
  -> monitoring registry memory atau MySQL
  -> memory store atau MySQL reading repository
  -> berubah saat simulator mengirim data dan halaman di-refresh
```

Setelah itu:

```text
user auth, role access, rate limit, audit log, rotasi key, backup
  -> dimatangkan sebelum pilot/production
```

## Prinsip Desain

- Gunakan API sebagai batas antara device dan dashboard.
- Simpan rumus di modul domain, bukan di komponen UI.
- Jangan menyimpan credential di repo.
- Jangan mengklaim production-ready sebelum deployment dan kalibrasi divalidasi.
- Buat dokumentasi cukup jelas agar kontributor baru bisa melanjutkan.
- Jangan menjadikan seluruh dashboard sebagai Client Component; gunakan client kecil hanya untuk interaksi seperti refresh dan jam.
