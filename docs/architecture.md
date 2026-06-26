# Arsitektur Sistem

Dokumen ini menjelaskan gambaran arsitektur Solar Tank Monitoring System dalam bahasa yang mudah diikuti.

## Ringkasan

Aplikasi ini dirancang sebagai sistem monitoring berbasis web.

Alur sederhananya:

```text
Device atau simulator
  -> API ingest
  -> normalisasi data
  -> penyimpanan sementara
  -> API baca
  -> dashboard web
```

Dashboard tidak membaca sensor secara langsung. Device atau simulator yang mengirim data ke server.

## Komponen Saat Ini

| Komponen | Lokasi | Status |
|---|---|---|
| Landing page | `src/app/page.tsx` | Ada |
| Dashboard awal | `src/app/dashboard/page.tsx` | Ada, masih frontend dummy |
| Detail tangki | `src/app/dashboard/tanks/[tankId]/page.tsx` | Ada, masih frontend dummy |
| API overview | `src/app/api/dashboard/overview/route.ts` | Ada |
| API detail tangki | `src/app/api/tanks/[tankId]/route.ts` | Ada |
| API history tangki | `src/app/api/tanks/[tankId]/readings/route.ts` | Ada |
| API ingest | `src/app/api/ingest/route.ts` | Ada |
| Memory store | `src/features/monitoring/lib/telemetry-store.ts` | Ada |
| Simulator | `scripts/simulate-device.mjs` | Ada |
| Unit test | `src/features/monitoring/tests` | Ada |

## Batas Frontend dan Backend

Frontend bertugas:

- menampilkan halaman;
- menampilkan status dan angka yang sudah rapi;
- memberi pengalaman baca yang mudah;
- tidak menghitung hal operasional penting secara tersebar.

Backend/API bertugas:

- menerima payload;
- memvalidasi device;
- memvalidasi key;
- menormalisasi payload;
- menyediakan data siap baca untuk dashboard;
- nanti menyimpan data ke database.

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
5. API mencari device di data dummy.
6. Payload dinormalisasi.
7. Reading disimpan di memory store.
8. Response HTTP 201 dikirim.
```

## Alur Baca

Endpoint baca mengambil data dari memory store:

```text
GET /api/dashboard/overview
GET /api/tanks/[tankId]
GET /api/tanks/[tankId]/readings
```

Saat dev server restart, memory store kembali ke data dummy awal.

## Data Dummy vs Data Real

Data dummy dipakai untuk:

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

Tahap berikutnya:

```text
UI dashboard/detail
  -> fetch API
  -> membaca data dari endpoint
  -> berubah saat simulator mengirim data
```

Setelah itu:

```text
memory store
  -> database lokal atau Postgres
  -> history lebih stabil
  -> siap deployment demo
```

## Prinsip Desain

- Gunakan API sebagai batas antara device dan dashboard.
- Simpan rumus di modul domain, bukan di komponen UI.
- Jangan menyimpan credential di repo.
- Jangan mengklaim production-ready sebelum deployment dan kalibrasi divalidasi.
- Buat dokumentasi cukup jelas agar kontributor baru bisa melanjutkan.
