# FTM — Fuel Tank Management

<div align="center">

<img src="public/logo/android-icon-192x192.png" alt="FTM" width="112" />

**Pemantauan isi tangki solar genset di gedung STO dari jarak jauh.**

[![CI](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-2563eb)](https://www.typescriptlang.org/)
[![Lisensi](https://img.shields.io/badge/lisensi-MIT-16a34a)](LICENSE)

[Status](#status-saat-ini) · [Arsitektur](#arsitektur) · [Menjalankan secara lokal](#menjalankan-secara-lokal) · [Dokumentasi](docs/README.md) · [Kontribusi](CONTRIBUTING.md)

</div>

## Apa itu FTM

FTM membantu tim catu daya mengetahui sisa **solar** (bahan bakar diesel untuk
genset, bukan panel surya) di tangki genset setiap STO (Sentral Telepon Otomat,
gedung perangkat Telkom) tanpa harus datang hanya untuk mengukur tangki.

Cara kerjanya:

1. Sensor ultrasonik di atas tangki mengukur jarak ke permukaan solar.
2. Perangkat kecil ESP8266 (papan mikrokontroler dengan Wi-Fi) mengubah jarak itu
   menjadi tinggi, liter, dan persen, lalu mengirimnya ke server kira-kira setiap
   20 detik.
3. Server memeriksa kunci perangkat, mencocokkan konfigurasi tangki, lalu
   menyimpan data ke database.
4. Petugas dan admin melihat hasilnya di dashboard web: daftar lokasi, peta,
   detail tangki, grafik, perkiraan sisa jam genset, status perangkat, dan ekspor
   CSV (berkas tabel yang bisa dibuka di Excel).

FTM tidak menggantikan SOP dan pemeriksaan fisik. Angka liter adalah hasil
perhitungan dari jarak, sehingga tetap perlu dicocokkan dengan pengukuran di
lapangan.

## Status saat ini

| Butir          | Keadaan                                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tahap          | Pilot operasional. Sistem sudah menerima data dari perangkat nyata, tetapi belum dikeraskan untuk produksi penuh: belum ada jaminan layanan (SLA) dan belum ada dukungan 24 jam.             |
| Cakupan        | Snapshot baca-saja per 11 Oktober 2026: 9 lokasi terdaftar dan 8 perangkat aktif, masing-masing mengirim data kira-kira setiap 20 detik.                                                     |
| Aplikasi       | Dijalankan di Vercel (layanan hosting awan). Setiap perubahan di branch `main` langsung terpasang ke aplikasi pilot.                                                                         |
| Database       | MySQL terkelola (Aiven).                                                                                                                                                                     |
| Yang belum ada | Backup otomatis, alarm otomatis (level kritis atau perangkat mati), dan pembatasan akses per lokasi. Ketiganya sudah tercatat sebagai pekerjaan berikutnya, bukan fitur yang sudah tersedia. |

Per Oktober 2026, repositori sedang dirapikan bertahap tanpa fitur baru dan tanpa
perubahan perilaku. Arah besarnya dicatat di [catatan keputusan](docs/decisions/README.md).

## Arsitektur

FTM adalah **satu aplikasi Next.js** (kerangka kerja web yang memuat tampilan dan
API sekaligus) yang ditulis dalam TypeScript dan menyimpan data di MySQL. Isinya
dipisah per modul (_modular monolith_: satu aplikasi yang dijalankan sebagai satu
unit, tetapi bagian-bagiannya punya tanggung jawab yang jelas).

```mermaid
flowchart LR
  subgraph Lapangan
    DEV[Perangkat ESP8266 + sensor ultrasonik]
  end
  subgraph App[Aplikasi FTM - Next.js]
    ING[/POST /api/ingest/]
    MON[Modul monitoring<br/>volume, status, riwayat]
    DEVMOD[Modul devices<br/>pengajuan dan paket firmware]
    AUTH[Modul akun<br/>login, peran, OTP]
    HD[Modul helpdesk]
    ADM[Modul admin<br/>perawatan data]
    UI[Halaman dashboard]
  end
  DB[(MySQL)]
  MAIL[Email SMTP]
  TG[Telegram]
  USER[Petugas dan admin]

  DEV -->|HTTPS, kunci per perangkat| ING
  ING --> MON
  MON --> DB
  UI --> MON
  UI --> DEVMOD
  UI --> AUTH
  UI --> ADM
  ADM --> DB
  DEVMOD --> DB
  DEVMOD --> MAIL
  AUTH --> DB
  AUTH --> MAIL
  AUTH --> TG
  HD --> TG
  USER --> UI
```

Penjelasan singkat:

- **Penerimaan data.** Perangkat mengirim data ke `/api/ingest` dengan header
  identitas dan kunci rahasia per perangkat. Format kiriman ini disebut **kontrak
  perangkat v1** dan **dibekukan**: perangkat yang sudah terpasang tidak bisa
  diperbarui dari jauh, jadi format, alamat, dan balasan server tidak boleh berubah.
- **Penyimpanan.** Setiap kiriman memperbarui dua hal dalam satu transaksi
  (sekelompok perubahan yang berhasil atau gagal bersama-sama): _snapshot_ terbaru
  (satu baris per perangkat) dan ringkasan 5 menit (rata-rata, minimum, maksimum,
  dan jumlah sampel per perangkat per 5 menit).
- **Pemasangan perangkat baru.** Petugas mengajukan perangkat, lalu admin
  menyetujui. Server membuat data lokasi, tangki, dan perangkat (belum aktif),
  kunci perangkat, serta paket firmware (program untuk perangkat) yang tautan
  unduhnya dikirim lewat email. Kiriman valid pertama dari perangkat mengaktifkan
  semuanya.
- **Akun.** Pendaftaran, verifikasi email, persetujuan admin, lalu login. Ada dua
  peran, `admin` dan `user`. Admin memakai OTP (kode sekali pakai) lewat email.
  Kata sandi disimpan sebagai hash Argon2id (bentuk acak yang tidak bisa dibalik).

Penjelasan tanpa istilah pemrograman ada di [docs/cara-kerja-ftm.md](docs/cara-kerja-ftm.md);
rincian teknis ada di [docs/architecture.md](docs/architecture.md).

## Menjalankan secara lokal

Aplikasi lokal **selalu** memakai database dan email lokal. Jangan pernah
mengarahkan laptop ke database atau alamat produksi.

### Prasyarat

- Node.js 22 (versi yang sama dengan CI);
- pnpm 9.15.3 (`corepack enable` akan memakai versi yang tercatat di
  `package.json`). Di Windows perintah itu butuh terminal Administrator; tanpa hak
  itu, pasang dengan `npm install -g pnpm@9.15.3` dan lewati `corepack enable`;
- Docker Desktop, untuk menjalankan MySQL dan penangkap email lokal.

### Langkah

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
corepack enable
pnpm install --frozen-lockfile

# 1. Nyalakan MySQL 8.4 dan penangkap email (Mailpit) di laptop
docker compose -f deploy/local/compose.yaml up -d

# 2. Buat file konfigurasi lokal dari contoh
Copy-Item .env.example .env.local
```

Isi `.env.local` dengan nilai **lokal** berikut. Nilai yang lain boleh dibiarkan
seperti contoh.

```dotenv
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://ftm_local:ftm-local-pass@127.0.0.1:3307/ftm_local"
MYSQL_SSL_MODE="disabled"
APP_BASE_URL="http://localhost:3000"
AUTH_SECRET="<isi teks acak minimal 32 karakter>"
AUTH_COOKIE_SECURE="false"
SMTP_HOST="127.0.0.1"
SMTP_PORT="1026"
SMTP_USER="local"
SMTP_PASS="local"
SMTP_FROM="FTM <noreply@example.test>"
SMTP_SECURE="false"
DEVICE_PACKAGE_ENCRYPTION_KEY="<isi teks acak base64url 32 byte>"
```

Teks acak bisa dibuat dengan:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Lanjutkan:

```powershell
# 3. Buat tabel dan data contoh di database LOKAL
pnpm db:setup:mysql

# 4. Buat akun admin lokal
$env:AUTH_BOOTSTRAP_ADMIN_EMAIL="admin@example.test"
$env:AUTH_BOOTSTRAP_ADMIN_USERNAME="admin"
$env:AUTH_BOOTSTRAP_ADMIN_PASSWORD="<kata sandi lokal minimal 10 karakter>"
pnpm auth:create-admin

# 5. Jalankan aplikasi
pnpm dev
```

Buka `http://localhost:3000`. Kode OTP admin dan email lain bisa dibaca di
penangkap email lokal `http://127.0.0.1:8026`.

Untuk mengirim data perangkat contoh ke server lokal:

```powershell
pnpm simulate:device --once
```

Mematikan stack lokal: `docker compose -f deploy/local/compose.yaml stop`.
Menghapus semua data lokal: `docker compose -f deploy/local/compose.yaml down -v`.

Tanpa Docker, aplikasi masih bisa dinyalakan dengan penyimpanan memori
(`SOLAR_TANK_STORAGE_DRIVER="memory"`), tetapi hanya halaman publik dan API
penerimaan data yang bisa dicoba. Login dan seluruh dashboard membutuhkan MySQL.

## Perintah

| Perintah                                                          | Fungsi                                                                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                                        | Menjalankan aplikasi untuk pengembangan                                                                                                        |
| `pnpm build` / `pnpm start`                                       | Membuat dan menjalankan versi produksi di laptop                                                                                               |
| `pnpm check`                                                      | Pemeriksaan lengkap: format, tipe TypeScript, lint, tes, build                                                                                 |
| `pnpm format`                                                     | Merapikan format kode dengan Prettier                                                                                                          |
| `pnpm typecheck`                                                  | Memeriksa tipe data TypeScript                                                                                                                 |
| `pnpm lint`                                                       | Memeriksa pola kode dengan ESLint                                                                                                              |
| `pnpm test`                                                       | Menjalankan tes otomatis (Vitest)                                                                                                              |
| `pnpm test:integration`                                           | Menjalankan tes integrasi terhadap MySQL lokal (butuh `FTM_TEST_MYSQL_URL`, lihat CONTRIBUTING)                                                |
| `pnpm simulate:device`                                            | Mengirim data perangkat contoh ke server lokal                                                                                                 |
| `pnpm db:setup:mysql`                                             | Membuat tabel dan data contoh di database lokal yang masih kosong                                                                              |
| `pnpm db:migrate:*`                                               | Menjalankan satu migrasi (skrip perubahan struktur database)                                                                                   |
| `pnpm auth:create-admin`                                          | Membuat akun admin pertama                                                                                                                     |
| `pnpm pilot:hash-key`                                             | Membuat kunci perangkat beserta hash-nya                                                                                                       |
| `pnpm pilot:registry`, `pnpm pilot:smoke`, `pnpm db:backup:mysql` | Alat operasional. Skrip ini menulis ke database atau alamat mana pun yang sedang diatur, jadi hanya dijalankan oleh pemelihara yang berwenang. |

## Struktur repositori

```text
.
├── .github/              # CI, template pull request dan issue, CODEOWNERS
├── config/               # templat registry yang aman dipublikasikan
├── database/
│   ├── migrations/       # migrasi MySQL berurutan (001–009 sudah dipakai pilot)
│   └── seeds/            # data contoh khusus pengembangan
├── deploy/local/         # MySQL dan penangkap email untuk laptop
├── docs/                 # dokumentasi; mulai dari docs/README.md
├── firmware/templates/   # templat firmware perangkat v1 (dibekukan)
├── public/               # logo dan ikon
├── scripts/              # migrasi, simulator, alat operasional
└── src/
    ├── app/              # halaman, API (route handler), dan server action Next.js
    ├── components/       # kerangka halaman bersama, akun, dan kit UI (components/ui/)
    ├── features/         # modul; tiap modul: components/, domain/, server/, tests/, types/
    │   ├── monitoring/   # tangki, pembacaan, status, dashboard, peta, penerimaan data perangkat
    │   ├── devices/      # pengajuan perangkat, kunci perangkat, paket firmware
    │   ├── auth/         # akun, sesi, OTP, email, Telegram
    │   ├── helpdesk/     # bantuan web yang terhubung ke Telegram
    │   └── admin/        # perawatan data (reset pembacaan, pembersihan data uji)
    └── lib/              # utilitas umum: format, pengaturan, koneksi database, pembantu HTTP
```

## Pemeriksaan kualitas

Setiap pull request menjalankan `pnpm check` di GitHub Actions. Jalankan juga di
laptop sebelum push:

```powershell
pnpm check
pnpm audit --prod
git diff --check
```

Tes otomatis memeriksa logika, bukan kalibrasi sensor atau keamanan instalasi
fisik.

## Dokumentasi

Daftar lengkap dokumen beserta tanggal pemeriksaannya ada di
[docs/README.md](docs/README.md). Yang paling sering dibutuhkan:

- [Arsitektur](docs/architecture.md)
- [Kontrak API](docs/api-contract.md) dan [penerimaan data perangkat](docs/device-ingestion.md)
- [Model data](docs/data-model.md) dan [model domain dan perhitungan](docs/domain-model.md)
- [Catatan keputusan arsitektur](docs/decisions/README.md)
- [Batasan dan keselamatan](docs/safety-and-limitations.md)
- [Panduan pengguna (PDF)](docs/panduan-user-manual-ftm.pdf)

## Kontribusi

Ikuti [CONTRIBUTING.md](CONTRIBUTING.md). Ringkasnya: buat branch dari `dev`,
pakai format commit `type(scope): deskripsi`, buka pull request ke `dev`, dan
pastikan pemeriksaan lulus. `main` hanya menerima rilis yang sudah disetujui.
Kontributor tercatat di riwayat Git dan halaman _Contributors_ GitHub.

## Keamanan

Laporkan dugaan kerentanan secara privat sesuai [SECURITY.md](SECURITY.md),
bukan lewat issue publik.

## Lisensi

Kode sumber berlisensi [MIT](LICENSE). Nama, logo, kredensial, data operasional,
dan informasi pihak lain tidak termasuk dalam lisensi tersebut.
