# FTM — Fuel Tank Management

<div align="center">

<img src="public/logo/android-icon-192x192.png" alt="Logo FTM" width="112" />

**Pilot operasional IoT untuk memantau tangki bahan bakar dari perangkat lapangan hingga dashboard.**

[![Status](https://img.shields.io/badge/status-pilot_operasional_aktif-0f766e)](docs/current-operational-truth.md)
[![CI](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-111827)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-2563eb)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

[Aplikasi aktif](https://solar-tank-monitoring-system.vercel.app) · [Status operasional](docs/current-operational-truth.md) · [Arsitektur](docs/architecture.md) · [Panduan pengguna](docs/panduan-user-manual-ftm.pdf)

</div>

## Tentang FTM

FTM adalah sistem pemantauan tangki bahan bakar yang menghubungkan sensor fisik,
perangkat ESP8266, API, database MySQL, dashboard web, serta kanal bantuan
Telegram. Sistem ini dikembangkan secara kolaboratif untuk kebutuhan pemantauan
catu daya dan telah diterapkan sebagai **pilot operasional internal di lingkungan
Telkom Indonesia/Telkominfra, dalam konteks TIF area Pasuruan–Sidoarjo**.

FTM bukan sekadar rancangan antarmuka atau demo dengan data buatan. Deployment
Vercel aktif menerima telemetry dari perangkat lapangan, menyimpannya di Aiven
MySQL, dan menyajikannya kepada akun pengguna yang telah melalui proses
persetujuan. Repo tetap menyediakan simulator dan data contoh agar pengembangan
lokal dapat dilakukan tanpa membuka data operasional.

> FTM saat ini berstatus **pilot lapangan aktif**, bukan produk nasional atau
> sistem yang sudah production-hardened. Dashboard membantu pemantauan; keputusan
> operasional dan keselamatan tetap mengikuti pemeriksaan lapangan serta prosedur
> resmi.

## Bukti Operasional yang Terverifikasi

Snapshot berikut berasal dari pemeriksaan read-only pada 13–14 Juli 2026. Angka
ini sengaja diberi tanggal karena kondisi perangkat dapat berubah.

| Indikator | Kondisi terverifikasi |
|---|---|
| Deployment web | Aktif di Vercel; landing page dan `/api/health` merespons HTTP 200 |
| Penyimpanan operasional | Aiven MySQL aktif dan dibaca oleh deployment serta development terotorisasi |
| Registry | 3 site, 3 tangki, dan 3 perangkat terdaftar |
| Telemetry | Lebih dari 9.000 pembacaan telah tersimpan pada audit 13 Juli 2026 |
| Kondisi saat audit | 2 perangkat mengirim data segar; 1 perangkat berstatus stale dan perlu diperiksa |
| Tampilan live | Dashboard mengambil snapshot terbaru dengan refresh default 20 detik |
| Riwayat hemat storage | Sampel live diringkas menjadi agregat 5 menit berisi mean, minimum, maksimum, dan jumlah sampel |
| Akun dan dukungan | Alur akun nyata, approval admin, email, Telegram, serta helpdesk telah digunakan |

Target awal rollout yang dibahas tim adalah 5 STO di area Pasuruan. Arah
pengembangan berikutnya dapat mencakup hingga 29 STO pada cakupan district
Sidoarjo, tetapi angka tersebut adalah **target ekspansi**, bukan jumlah lokasi
yang sudah aktif atau jaminan kapasitas produksi.

## Masalah yang Diselesaikan

Pengecekan isi tangki secara manual tidak selalu memberi visibilitas cepat
tentang perubahan volume, keterlambatan perangkat, atau perkiraan sisa waktu
operasional genset. FTM membantu operator menjawab:

- berapa liter dan persentase bahan bakar yang diperkirakan tersisa;
- kapan perangkat terakhir mengirim data;
- lokasi mana yang perlu diperiksa lebih dahulu;
- bagaimana perubahan volume dalam rentang harian, mingguan, atau bulanan;
- berapa estimasi durasi operasional berdasarkan parameter beban;
- apakah konfigurasi yang dikirim perangkat sesuai dengan registry yang disetujui.

## Alur Sistem

```text
Sensor ultrasonik
  -> ESP8266 menghitung dan mengirim telemetry
  -> POST /api/ingest
  -> validasi identitas perangkat dan device key
  -> normalisasi serta pemeriksaan konfigurasi
  -> Aiven MySQL
       -> 1 snapshot terbaru per perangkat untuk dashboard live
       -> 1 agregat per 5 menit untuk grafik dan CSV
  -> API dashboard/detail
  -> dashboard operator dan admin di Vercel
```

Data live dan data historis mempunyai tujuan berbeda:

- **Snapshot live** selalu diganti dengan pembacaan terbaru. Dashboard tetap
  terasa real-time tanpa menambah satu baris history setiap 20 detik.
- **Agregat 5 menit** menyimpan informasi analitis penting—rata-rata, minimum,
  maksimum, dan jumlah sampel—dengan jumlah baris sekitar 15 kali lebih sedikit
  daripada menyimpan seluruh sampel 20 detik.

## Kemampuan Utama

### Monitoring dan analisis

- dashboard kartu dan peta dengan filter Regional, Wilayah, Area, STO, serta status;
- detail tangki, status online/offline, level, volume, dan estimasi runtime;
- refresh otomatis 20 detik dengan pause/resume dan refresh manual;
- grafik 1 hari, 7 hari, dan 30 hari dari history MySQL;
- export CSV sesuai rentang grafik;
- penanda mismatch antara konfigurasi payload dan registry;
- reset reading per STO atau seluruh reading tanpa menghapus akun dan registry.

### Akun dan keamanan aplikasi

- pengajuan akun, verifikasi email, login, lupa/reset kata sandi;
- session cookie `httpOnly`, hash password Argon2id, dan OTP admin;
- Cloudflare Turnstile untuk formulir publik ketika diaktifkan;
- role `admin` dan `user`, manajemen akun, pencabutan sesi, serta audit event;
- binding satu akun Telegram ke satu akun FTM;
- readiness endpoint yang dilindungi untuk memeriksa dependency operasional.

### Siklus hidup perangkat

- user mengajukan perangkat dan data lokasi;
- admin meninjau pengajuan melalui web;
- sistem menghitung kapasitas dan konsumsi berdasarkan parameter teknis;
- device key, konfigurasi, dan paket firmware ZIP dibuat setelah approval;
- paket firmware disimpan terenkripsi dan diunduh melalui token terbatas;
- perangkat baru aktif setelah mengirim first valid ping dengan key yang cocok;
- admin dapat membersihkan data perangkat uji secara selektif dan aman.

### Operasi dan kolaborasi

- helpdesk web yang terhubung ke Telegram admin;
- command Telegram untuk bantuan, status binding, dan tautan dashboard;
- backup MySQL manual/terjadwal;
- health check dan readiness check;
- CI yang menjalankan typecheck, lint, test, dan production build;
- dokumentasi teknis dan panduan pengguna berbahasa Indonesia.

## Status Kematangan

Yang sudah terbukti untuk pilot:

- alur perangkat fisik → API → database → dashboard;
- deployment Vercel dan database Aiven aktif;
- provisioning perangkat sampai first valid ping;
- akun nyata, approval, email, Telegram, dan helpdesk;
- snapshot live, rollup 5 menit, grafik, CSV, backup, serta automated checks.

Yang masih menjadi syarat sebelum disebut production-ready:

- validasi TLS firmware dan pengamanan OTA/diagnostik lokal;
- kalibrasi fisik serta dokumentasi toleransi tiap tangki;
- backup terenkripsi dan restore drill yang terbukti;
- alert otomatis untuk level kritis, perangkat offline, dan kegagalan pengiriman;
- pembatasan akses user per area/STO;
- monitoring, SOP insiden, rotasi key, dan penanggung jawab pemulihan;
- load test, quota, dan biaya untuk target ekspansi;
- persetujuan keselamatan hardware dan operasional dari pihak berwenang.

Rincian batas klaim tersedia di
[Batasan dan Keselamatan](docs/safety-and-limitations.md).

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Aplikasi | Next.js 16 App Router, React 19, TypeScript strict |
| UI | Tailwind CSS 4, lucide-react, Three.js |
| Database | MySQL melalui `mysql2`, deployment operasional memakai Aiven |
| Auth dan komunikasi | Argon2id, email SMTP, Cloudflare Turnstile, Telegram Bot API |
| Perangkat | ESP8266 dan sensor ultrasonik dengan paket firmware per device |
| Deployment | Vercel |
| Quality gate | Vitest, ESLint, TypeScript, Next.js production build, GitHub Actions |

## Struktur Repositori

```text
.
├── .github/                 # workflow CI dan template issue
├── config/                  # template registry public-safe
├── database/
│   ├── migrations/         # perubahan schema MySQL berurutan
│   └── seeds/              # data contoh khusus development
├── docs/                    # arsitektur, operasi, API, safety, dan panduan
├── firmware/templates/      # template firmware perangkat
├── scripts/                 # migration, simulator, backup, dan smoke test
└── src/
    ├── app/                 # halaman dan Route Handler Next.js
    ├── components/          # komponen lintas fitur
    └── features/
        ├── auth/            # akun, session, email, Telegram, dan audit
        ├── helpdesk/        # komunikasi web ↔ Telegram
        └── monitoring/      # domain, repository, storage, dashboard, dan test
```

## Menjalankan Secara Lokal

Prasyarat:

- Node.js 20 atau lebih baru;
- pnpm 9.15.3;
- MySQL hanya diperlukan untuk mencoba mode penyimpanan permanen.

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
corepack enable
pnpm install
pnpm dev
```

Buka `http://localhost:3000`.

Secara default, development memakai memory store dan data contoh public-safe.
Data ini hanya untuk pengembangan dan tidak mewakili kondisi lapangan. Untuk
mencoba alur ingest tanpa perangkat fisik:

```powershell
pnpm simulate:device --once
```

Jangan menghubungkan clone publik ke database operasional tanpa izin, credential
yang dikelola dengan aman, dan pemahaman terhadap konsekuensi penulisan data.

## Mode MySQL untuk Development Terotorisasi

1. Salin `.env.example` menjadi `.env.local`.
2. Isi database dan secret milik environment development—jangan memakai nilai
   dari screenshot, chat, atau dokumentasi lama.
3. Jalankan migration, lalu seed hanya pada database yang memang boleh berisi
   data contoh.

```powershell
pnpm db:setup:mysql
pnpm auth:create-admin
pnpm dev
```

Untuk database yang sudah berisi data, **jangan menjalankan seed**. Buat backup,
jalankan migration berurutan, lalu periksa `/api/ready` dengan akses admin atau
token operasional.

```powershell
pnpm db:backup:mysql
pnpm db:migrate:mysql
pnpm db:migrate:auth
pnpm db:migrate:auth-recovery
pnpm db:migrate:device-provisioning
pnpm db:migrate:device-request-fields
pnpm db:migrate:helpdesk
pnpm db:migrate:reading-rollup
pnpm db:migrate:auth-telegram
pnpm db:migrate:site-taxonomy
```

## Script Penting

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Menjalankan development server dengan Turbopack |
| `pnpm dev:lan` | Membuka development server pada jaringan lokal terotorisasi |
| `pnpm dev:webpack` | Opsi kompatibilitas development jika benar-benar diperlukan |
| `pnpm simulate:device` | Mengirim telemetry contoh ke development server |
| `pnpm pilot:hash-key` | Membuat device key dan hash untuk onboarding terotorisasi |
| `pnpm pilot:registry` | Memvalidasi serta menerapkan registry lokal yang tidak di-commit |
| `pnpm pilot:smoke` | Menguji ingest dengan payload berformat perangkat |
| `pnpm db:backup:mysql` | Membuat backup MySQL ke folder yang diabaikan Git |
| `pnpm db:migrate:*` | Menjalankan migration schema tertentu |
| `pnpm check` | Menjalankan typecheck, lint, test, dan production build |

## Konfigurasi dan Rahasia

Gunakan [.env.example](.env.example) hanya sebagai daftar nama konfigurasi.

- `.env.local`, database URL, password, token, device key, dan credential tidak
  boleh di-commit atau ditempel ke issue/PR/chat publik;
- hanya variabel yang memang aman untuk browser boleh memakai prefix
  `NEXT_PUBLIC_`;
- data operasional, koordinat sensitif, daftar akun, dan registry nyata tidak
  disimpan di repo publik;
- `config/pilot-registry.example.json` adalah template, sedangkan file
  `*.local.json` harus tetap lokal dan diabaikan Git;
- seed dan simulator selalu dianggap data pengembangan, bukan bukti lapangan.

Laporkan kerentanan melalui [SECURITY.md](SECURITY.md), bukan issue publik.

## Dokumentasi

| Dokumen | Kegunaan |
|---|---|
| [Current Operational Truth](docs/current-operational-truth.md) | Status aktif, batas klaim, dan alur resmi terbaru |
| [Architecture](docs/architecture.md) | Hubungan perangkat, aplikasi, database, dan UI |
| [API Contract](docs/api-contract.md) | Kontrak endpoint dan format data |
| [Data Model](docs/data-model.md) | Entitas site, tangki, device, reading, dan provisioning |
| [Device Ingestion](docs/device-ingestion.md) | Header, payload, normalisasi, dan pengujian ingest |
| [Deployment](docs/deployment.md) | Development, Vercel, MySQL, migration, dan readiness |
| [Database Backup](docs/database-backup.md) | Backup, retention, dan batas pemulihan |
| [Target Rollout 5 STO](docs/pilot-readiness.md) | Persiapan menuju tahap awal 5 STO tanpa menganggapnya sudah tercapai |
| [Safety and Limitations](docs/safety-and-limitations.md) | Batas software, data, hardware, dan keputusan operasional |
| [Reviewer Quickstart](docs/reviewer-quickstart.md) | Jalur singkat untuk reviewer teknis |
| [User Manual](docs/panduan-user-manual-ftm.pdf) | Panduan penggunaan FTM untuk pembaca nonteknis |

## Quality Gate

Sebelum push atau membuka pull request:

```powershell
pnpm check
```

Perintah tersebut menjalankan TypeScript typecheck, ESLint, seluruh test Vitest,
dan Next.js production build. Perubahan runtime juga harus diperiksa pada alur
yang terkena dampak; build yang lulus tidak membuktikan akurasi sensor atau
keselamatan instalasi fisik.

## Kontribusi

Gunakan branch terpisah dan pull request. Ikuti
[CONTRIBUTING.md](CONTRIBUTING.md), pertahankan data contoh agar public-safe,
dan jangan menulis istilah internal sementara seperti nomor batch pada pesan
yang dilihat pengguna atau dokumentasi jangka panjang.

| Kontributor | Fokus kontribusi |
|---|---|
| [Muhammad Zaenal Abidin Abdurrahman](https://github.com/Zendin110206) | Pengelolaan proyek, arsitektur aplikasi, backend/database, auth, deployment, integrasi, testing, dan review |
| [Yattaqi Muazirul Mulki](https://github.com/ukiirving) | UI/UX dan pengembangan aplikasi |
| [Astra](https://github.com/Ata22) | Perangkat/firmware, pengujian lapangan, Telegram, serta masukan operasional |

FTM dibangun melalui kolaborasi dengan personel yang memberi kebutuhan,
pengujian, dan masukan lapangan. Repo ini tidak mengklaim bahwa satu orang
mengerjakan seluruh sistem atau bahwa FTM telah ditetapkan sebagai produk resmi
nasional Telkom Indonesia.

## Lisensi

Kode pada repo ini tersedia dengan lisensi [MIT](LICENSE). Nama, logo, data,
credential, dan informasi operasional pihak lain tidak otomatis ikut dilisensikan.
