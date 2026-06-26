# Development Log

Dokumen ini mencatat perkembangan implementasi secara ringkas.

## 2026-06-24 - Fondasi Repo dan Dokumentasi Awal

Pekerjaan:

- scaffold repositori;
- README awal;
- struktur dokumentasi;
- batas keamanan publik;
- konfigurasi Next.js, TypeScript, Tailwind, ESLint, Vitest.

## 2026-06-25 - Landing Page

Pekerjaan:

- membuat landing page Bahasa Indonesia;
- menyesuaikan konteks menjadi monitoring tangki;
- menambahkan navigasi ke dashboard;
- menjaga gaya visual bersih dan profesional.

## 2026-06-25 - Dashboard dan Detail Frontend

Pekerjaan:

- membuat halaman `/dashboard`;
- membuat halaman `/dashboard/tanks/[tankId]`;
- menampilkan peta ilustratif;
- menampilkan status lokasi;
- menampilkan visual tangki dan parameter sensor.

Catatan:

```text
Halaman awal memakai data contoh agar layout dan istilah operasional bisa divalidasi sebelum API ingest dibuat.
```

## 2026-06-25 - Domain Monitoring

Pekerjaan:

- membuat type monitoring;
- membuat mock site, tank, device, reading;
- membuat runtime logic;
- membuat status logic;
- membuat tank volume logic;
- membuat normalizer payload;
- membuat view model dashboard dan detail;
- menambahkan unit test.

## 2026-06-26 - API Read-only

Pekerjaan:

- `GET /api/dashboard/overview`;
- `GET /api/tanks/[tankId]`;
- `GET /api/tanks/[tankId]/readings`;
- endpoint membaca data dari domain/view model.

## 2026-06-26 - API Ingest dan Memory Store

Pekerjaan:

- `POST /api/ingest`;
- validasi `X-Device-Id`;
- validasi `X-Api-Key`;
- normalisasi payload CAT-like;
- memory store lokal;
- test ingest dan error case.

## 2026-06-26 - Simulator Device

Pekerjaan:

- `scripts/simulate-device.mjs`;
- script `pnpm simulate:device`;
- mode sekali jalan;
- mode berulang;
- opsi device, key, interval, persen awal, dan critical mode;
- verifikasi payload masuk ke API.

## 2026-06-26 - Dokumentasi dan Maintenance Repo

Pekerjaan:

- README disinkronkan dengan kondisi aktual;
- dokumen `docs/` diisi;
- CONTRIBUTING dan SECURITY diperjelas;
- `.env.example` diperbarui;
- GitHub Actions CI ditambahkan;
- issue template ditambahkan;
- placeholder `.gitkeep` dibersihkan.

## Status Verifikasi Terakhir

Perintah:

```powershell
pnpm check
```

Ekspektasi:

```text
typecheck lulus
lint lulus
test lulus
build lulus
```
