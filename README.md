# Solar Tank Monitoring System

![Status](https://img.shields.io/badge/status-prototipe_aktif-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-111827)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Lisensi](https://img.shields.io/badge/lisensi-MIT-green)

Solar Tank Monitoring System adalah prototipe aplikasi web untuk memantau volume tangki bahan bakar dari data perangkat atau simulator. Aplikasi ini menyiapkan alur dasar monitoring: data dikirim ke API, data divalidasi, data dinormalisasi, lalu dashboard dapat menampilkan volume, persentase isi, estimasi durasi operasional, status perangkat, dan riwayat pembacaan.

Repositori ini menggunakan Bahasa Indonesia agar mudah dibaca oleh pengguna operasional, reviewer non-IT, dan pengembang berikutnya.

## Status Saat Ini

Repositori sudah melewati tahap fondasi awal dan sekarang berada pada tahap prototipe aplikasi monitoring dengan alur data lokal, API ingest, simulator, auto-refresh dashboard, dan fondasi penyimpanan MySQL opsional.

Yang sudah tersedia:

- landing page berbahasa Indonesia;
- halaman login dan pengajuan akses frontend-only;
- halaman dashboard awal;
- halaman detail tangki awal;
- data contoh untuk lokasi, tangki, perangkat, dan pembacaan;
- timestamp data contoh memory mode digeser relatif ke waktu server start agar demo awal tetap mudah dibaca;
- fungsi domain untuk volume, runtime, status, dan normalisasi payload;
- unit test untuk logika domain dan telemetry store;
- API baca:
  - `GET /api/dashboard/overview`
  - `GET /api/tanks/[tankId]`
  - `GET /api/tanks/[tankId]/readings`
- API ingest:
  - `POST /api/ingest`
- memory store lokal untuk menerima data simulator selama dev server hidup;
- fondasi MySQL untuk menyimpan reading secara permanen pada mode pengembangan lanjutan;
- dashboard dan detail membaca storage aktif yang sama dengan endpoint API;
- auto-refresh ringan pada dashboard dan detail, dengan tombol refresh manual serta pause/resume;
- validasi key per device memakai hash pada data dummy;
- fallback key global hanya untuk development lokal;
- simulator terminal:
  - `pnpm simulate:device`
- dokumentasi teknis dan operasional di folder `docs/`;
- GitHub Actions CI untuk menjalankan `pnpm check`.

Yang belum tersedia:

- autentikasi pengguna final;
- proses pembuatan akun sungguhan;
- role admin, operator, atau viewer;
- integrasi perangkat fisik;
- deployment produksi;
- kalibrasi tangki nyata;
- notifikasi;
- registry site, tank, device, dan device key yang sepenuhnya berasal dari database;
- rate limit dan audit log untuk endpoint ingest.

Catatan penting:

```text
Saat ini dashboard dan detail sudah membaca storage aktif lewat layer aplikasi. Mode default tetap `memory` agar mudah dicoba. Mode `mysql` sudah tersedia untuk latihan persistent storage, tetapi belum boleh dianggap production-ready karena registry device dan pengelolaan user belum final.
```

## Tujuan Produk

Tujuan proyek ini adalah membantu pengguna operasional melihat kondisi tangki secara lebih cepat dan terstruktur.

Contoh pertanyaan yang ingin dijawab aplikasi:

- berapa liter bahan bakar yang tersisa;
- berapa persen isi tangki saat ini;
- kira-kira cukup berapa jam jika beban berjalan seperti asumsi;
- perangkat masih online atau sudah terlambat mengirim data;
- lokasi mana yang perlu dicek lebih dulu;
- bagaimana riwayat perubahan volume dari waktu ke waktu.

Prinsip utamanya:

```text
Dashboard membantu membaca kondisi. Keputusan operasional tetap harus mengikuti validasi lapangan dan prosedur resmi.
```

## Gambaran Alur Data

Alur yang sedang dibangun:

```text
Perangkat atau simulator
  -> POST /api/ingest
  -> validasi device dan key
  -> normalisasi payload
  -> storage aktif: memory atau MySQL
  -> API dashboard/detail
  -> tampilan web
```

Penjelasan singkat:

1. Sensor atau simulator menghasilkan data pembacaan.
2. Device mengirim data ke API, bukan langsung ke dashboard.
3. API mengecek identitas device dan key.
4. Data mentah diubah menjadi format yang konsisten.
5. Data disimpan ke storage aktif. Default development memakai memory; mode MySQL bisa diaktifkan lewat env.
6. Endpoint baca mengambil data terbaru dan riwayat.
7. Dashboard menampilkan status yang lebih mudah dipahami.

## Kenapa Ada Simulator

Simulator diperlukan agar pengembangan software tidak menunggu perangkat fisik.

Dengan simulator, pengembang bisa mengecek:

- API bisa menerima payload;
- key salah ditolak;
- data terbaru berubah;
- history bertambah;
- perhitungan runtime tetap masuk akal;
- alur dashboard nanti siap disambungkan.

Perintah dasar:

```powershell
pnpm simulate:device --once
```

Contoh skenario tangki rendah:

```powershell
pnpm simulate:device --critical --once
```

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework aplikasi | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, lucide-react |
| Bahasa | TypeScript |
| Test | Vitest |
| Package manager | pnpm |
| Storage saat ini | Memory store lokal, dengan opsi MySQL untuk reading |
| Simulator | Node.js script tanpa dependency tambahan |

## Struktur Repositori

Struktur aktif saat ini:

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── docs/
│   ├── api-contract.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── decision-log.md
│   ├── deployment.md
│   ├── development-log.md
│   ├── device-ingestion.md
│   ├── domain-model.md
│   ├── reviewer-quickstart.md
│   ├── roadmap.md
│   ├── safety-and-limitations.md
│   └── system-boundaries.md
├── database/
│   ├── migrations/
│   └── seeds/
├── scripts/
│   └── simulate-device.mjs
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── features/
│       └── monitoring/
│           ├── components/
│           ├── data/
│           ├── lib/
│           ├── tests/
│           └── types/
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
└── pnpm-lock.yaml
```

Penjelasan folder utama:

| Folder | Fungsi |
|---|---|
| `src/app` | Halaman Next.js dan API route |
| `src/features/monitoring/components` | Komponen client kecil untuk refresh dan jam real-time |
| `src/features/monitoring/data` | Data contoh yang aman untuk pengembangan |
| `src/features/monitoring/lib` | Logika domain, normalisasi, view model, storage facade, memory store, dan repository MySQL |
| `src/features/monitoring/tests` | Unit test untuk logika monitoring |
| `database` | Migration dan seed MySQL untuk latihan persistent storage |
| `scripts` | Alat bantu development, termasuk simulator device |
| `docs` | Dokumentasi arsitektur, API, domain, roadmap, dan batasan |
| `.github` | CI dan template issue |

## Menjalankan Project

Prasyarat:

- Git;
- Node.js 20 atau lebih baru;
- pnpm 9.x;
- PowerShell, Git Bash, atau terminal lain.

Jika `pnpm` belum tersedia, aktifkan lewat Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.15.3 --activate
```

Clone repository:

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
```

Install dependency:

```powershell
pnpm install
```

Jalankan dev server:

```powershell
pnpm dev
```

Buka:

```text
http://localhost:3000
```

Halaman penting:

| Halaman | Fungsi |
|---|---|
| `/` | Landing page |
| `/login` | Tampilan masuk frontend-only |
| `/register` | Tampilan pengajuan akses frontend-only |
| `/dashboard` | Dashboard awal |
| `/dashboard/tanks/tank-tph-main` | Detail tangki contoh |

## Menjalankan Simulator

Pastikan `pnpm dev` sudah berjalan.

Kirim satu payload:

```powershell
pnpm simulate:device --once
```

Kirim payload dengan persen tertentu:

```powershell
pnpm simulate:device --device demo-tph-01 --start-percent 73 --once
```

Jalankan terus setiap 5 detik:

```powershell
pnpm simulate:device
```

Hentikan simulator dengan:

```text
Ctrl + C
```

## Mengecek API Secara Manual

Cek detail tangki:

```powershell
curl.exe http://localhost:3000/api/tanks/tank-tph-main
```

Cek history:

```powershell
curl.exe "http://localhost:3000/api/tanks/tank-tph-main/readings?range=24h"
```

Kirim payload manual:

```powershell
curl.exe -X POST http://localhost:3000/api/ingest `
  -H "Content-Type: application/json" `
  -H "X-Device-Id: demo-tph-01" `
  -H "X-Api-Key: demo-tph-key" `
  -d "{\"device\":\"demo-tph-01\",\"ts\":0,\"distance\":40.5,\"voltage\":3.86,\"raw\":{\"H_cm\":109.5,\"volume\":3650,\"percent\":73,\"wifi_rssi\":-55}}"
```

## Script

| Script | Fungsi |
|---|---|
| `pnpm dev` | Menjalankan dev server |
| `pnpm build` | Membuat build produksi |
| `pnpm start` | Menjalankan hasil build |
| `pnpm lint` | Menjalankan ESLint |
| `pnpm typecheck` | Mengecek tipe TypeScript |
| `pnpm test` | Menjalankan unit test |
| `pnpm test:watch` | Menjalankan test dalam mode watch |
| `pnpm simulate:device` | Menjalankan simulator device |
| `pnpm check` | Menjalankan typecheck, lint, test, dan build |

## Variabel Lingkungan

Salin contoh env jika diperlukan:

```powershell
Copy-Item .env.example .env.local
```

Variabel yang relevan saat ini:

| Variabel | Fungsi |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nama aplikasi |
| `NEXT_PUBLIC_APP_ENV` | Label environment |
| `NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL_MS` | Interval auto-refresh dashboard/detail. Default `20000` ms |
| `SOLAR_TANK_STORAGE_DRIVER` | Pilih `memory` atau `mysql`. Default aman untuk development adalah `memory` |
| `MYSQL_DATABASE_URL` | Connection string MySQL, hanya dipakai ketika storage driver `mysql` |
| `SOLAR_TANK_LOCAL_DEVICE_KEY` | Key fallback global untuk development lokal |
| `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` | Set `false` untuk menolak fallback global dan memakai key per device |
| `SOLAR_TANK_DEVICE_KEY` | Override key simulator untuk satu device jika dibutuhkan |

Simulator otomatis memakai key demo sesuai device dummy. Contoh:

```text
demo-tph-01 -> demo-tph-key
demo-psn-01 -> demo-psn-key
demo-nja-01 -> demo-nja-key
demo-jto-01 -> demo-jto-key
demo-skp-01 -> demo-skp-key
```

`local-development-key` tetap tersedia sebagai fallback development jika `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` tidak dimatikan. Jangan gunakan fallback global untuk pilot atau production.

## Mode MySQL Opsional

Mode default tetap `memory`, sehingga aplikasi bisa langsung dicoba tanpa database.

Jika ingin latihan data reading yang tidak hilang saat server restart:

1. Buat database MySQL lokal.
2. Jalankan SQL di `database/migrations/001_create_monitoring_core_mysql.sql`.
3. Jalankan SQL di `database/seeds/001_seed_demo_monitoring_reference_mysql.sql`.
4. Isi `.env.local`:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://solar_tank_app:password@127.0.0.1:3306/solar_tank_monitoring"
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"
```

Catatan:

- fondasi MySQL saat ini memfokuskan penyimpanan reading;
- registry site, tank, device, dan rotasi key database masih tahap berikutnya;
- jangan masukkan password database asli ke Git.

## Peta Dokumentasi

| Dokumen | Isi |
|---|---|
| `docs/reviewer-quickstart.md` | Panduan cepat menjalankan dan mengecek repo |
| `docs/architecture.md` | Gambaran arsitektur saat ini dan target berikutnya |
| `docs/api-contract.md` | Kontrak endpoint API |
| `docs/device-ingestion.md` | Format payload device dan simulator |
| `docs/data-model.md` | Entitas data utama |
| `docs/domain-model.md` | Rumus volume, persen, runtime, dan status |
| `docs/deployment.md` | Catatan deployment lokal, demo, dan self-hosted |
| `docs/roadmap.md` | Rencana pengembangan bertahap |
| `docs/safety-and-limitations.md` | Batasan dan keselamatan |
| `docs/system-boundaries.md` | Hal yang masuk dan tidak masuk repo publik |
| `docs/decision-log.md` | Keputusan teknis yang sudah diambil |
| `docs/development-log.md` | Catatan perkembangan implementasi |

## Alur Kerja Kontributor

Sebelum mulai mengubah kode:

```powershell
git pull --rebase origin main
pnpm install
pnpm check
```

Sebelum push:

```powershell
git status
pnpm check
git add .
git commit -m "docs(readme): rapikan dokumentasi proyek"
git push origin main
```

Aturan penting:

- jangan commit `.env.local`;
- jangan commit data real;
- jangan commit credential;
- jangan commit folder `local_context`;
- jangan force push kecuali sudah disepakati;
- kalau ada konflik Git, berhenti dulu dan minta bantuan.

Panduan kontribusi lebih lengkap ada di `CONTRIBUTING.md`.

## Batasan Produksi

Repositori ini belum siap production.

Sebelum dipakai dengan perangkat dan tangki nyata, perlu validasi:

- bentuk dan dimensi tangki;
- posisi sensor;
- metode kalibrasi;
- toleransi error sensor;
- konsumsi bahan bakar per lokasi;
- interval pengiriman device;
- keamanan API key;
- akses user dan role;
- deployment server;
- backup database;
- rate limit dan audit log endpoint ingest;
- rotasi key per device;
- cara menonaktifkan fallback data dummy;
- prosedur keselamatan lapangan.

## Pemelihara dan Kontributor

| Nama | Peran | Profil |
|---|---|---|
| Muhammad Zaenal Abidin Abdurrahman | Pengelola proyek dan pengembangan awal | - |
| Yattaqi Muazirul Mulki | Kolaborator pengembangan aplikasi | [ukiirving](https://github.com/ukiirving) |

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat `LICENSE` untuk detail.
