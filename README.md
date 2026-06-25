# Solar Tank Monitoring System

![Status](https://img.shields.io/badge/status-fondasi_repositori-blue)
![Teknologi](https://img.shields.io/badge/teknologi-Next.js%20%7C%20TypeScript%20%7C%20Telemetri-111827)
![Lisensi](https://img.shields.io/badge/lisensi-MIT-green)

Solar Tank Monitoring System adalah fondasi aplikasi web untuk memantau data tangki bahan bakar berbasis telemetri. Aplikasi ini dirancang untuk menampilkan estimasi volume, persentase isi tangki, estimasi durasi operasional, status risiko, dan riwayat pembacaan dari perangkat IoT atau simulator.

Repositori ini sedang berada pada tahap pematangan struktur. Fokus saat ini adalah menyiapkan fondasi proyek yang rapi, mudah dipelihara, aman untuk repositori publik, dan siap dikembangkan bertahap menjadi sistem monitoring yang lebih lengkap.

## Status Proyek

Tahap saat ini:

```text
Fondasi repositori dan struktur proyek.
```

Yang sudah tersedia:

- kerangka aplikasi Next.js;
- struktur folder untuk dashboard, telemetri, perhitungan tangki, simulator, deployment, firmware, database, dan pengujian;
- README dan dokumen repositori dasar dalam Bahasa Indonesia;
- aturan dasar agar repositori publik tidak memuat data sensitif;
- placeholder folder untuk fase implementasi berikutnya.

Yang belum tersedia:

- dashboard monitoring final;
- integrasi perangkat fisik;
- database produksi;
- autentikasi final;
- simulator telemetri;
- API penerimaan telemetri yang sudah aktif;
- konfigurasi deployment produksi.

## Tujuan Proyek

Tujuan jangka panjang proyek ini adalah menyediakan sistem monitoring tangki bahan bakar yang bisa membantu pengguna operasional melihat kondisi persediaan secara lebih cepat dan terstruktur.

Alur yang ingin dibangun:

1. perangkat atau simulator mengirim data telemetri;
2. aplikasi menerima dan memvalidasi data;
3. data mentah dinormalisasi menjadi format yang konsisten;
4. konfigurasi bentuk dan dimensi tangki digunakan untuk menghitung volume;
5. volume dikonversi menjadi estimasi durasi operasional;
6. dashboard menampilkan status, riwayat, dan indikator risiko;
7. sistem dapat dikembangkan menuju notifikasi dan deployment internal.

## Prinsip Produk

```text
Data membantu pemantauan, keputusan tetap berada pada operator.
```

Aplikasi ini dibuat untuk membantu membaca kondisi operasional. Aplikasi tidak boleh diklaim siap produksi sebelum perangkat, rumus, kalibrasi, keamanan, jaringan, dan prosedur operasional benar-benar divalidasi.

## Ruang Lingkup Saat Ini

Repositori ini disiapkan untuk:

- pengembangan lokal dengan data dummy;
- simulasi pengiriman telemetri;
- perhitungan volume berdasarkan konfigurasi tangki;
- dashboard monitoring berbasis web;
- kontrak API yang jelas untuk perangkat atau simulator;
- dokumentasi yang mudah dipahami oleh pengembang berikutnya.

Repositori ini tidak memuat:

- kredensial asli;
- data telemetri nyata;
- konfigurasi jaringan internal;
- alamat domain produksi;
- API key perangkat;
- password database;
- file deployment privat;
- klaim bahwa sistem sudah siap dipakai di lapangan.

## Pelajaran Desain yang Diterapkan

Struktur repositori ini disusun berdasarkan kebutuhan umum sistem monitoring berbasis perangkat lapangan. Beberapa prinsip desain yang dipakai:

- perangkat mengirim data ke server, bukan dashboard menarik data langsung dari perangkat lokal;
- server bertanggung jawab menerima, memvalidasi, menormalisasi, dan menyimpan data;
- rumus perhitungan tangki dipisahkan dari tampilan agar mudah diuji;
- format payload dari perangkat bisa berubah, sehingga diperlukan lapisan normalisasi;
- simulator diperlukan agar pengembangan tidak berhenti saat perangkat fisik belum tersedia;
- konfigurasi deployment dipisahkan dari logika aplikasi;
- repositori publik tidak boleh memuat rahasia atau data internal.

## Prinsip Pemeliharaan dan Skalabilitas

Proyek ini disiapkan agar tidak berhenti sebagai demo satu kali pakai. Struktur dan dokumentasinya diarahkan supaya pengembang berikutnya bisa memahami alur sistem, menambah fitur, dan mengganti detail teknis tanpa membongkar seluruh kode.

Prinsip pemeliharaan yang dipakai:

- logika perhitungan tangki ditempatkan di modul tersendiri agar bisa diuji tanpa membuka halaman dashboard;
- komponen antarmuka dipisahkan dari proses pengambilan dan pengolahan data;
- kontrak API ditulis sejak awal agar perangkat, simulator, dan dashboard memiliki kesepakatan format data yang sama;
- konfigurasi lokasi, perangkat, tangki, ambang status, dan konsumsi bahan bakar disiapkan sebagai data konfigurasi, bukan nilai yang tersebar acak di banyak file;
- simulator tetap disediakan agar pengembangan bisa berjalan walaupun perangkat fisik belum tersambung;
- dokumentasi keputusan teknis disimpan di `docs/decision-log.md` agar alasan perubahan tetap bisa dilacak;
- data contoh harus aman untuk publik dan tidak boleh menyerupai kredensial, alamat jaringan internal, atau data produksi;
- setiap fitur penting perlu memiliki jalur pengujian, minimal untuk rumus volume, estimasi durasi operasional, klasifikasi status, validasi payload, dan normalisasi data.

Dengan pola ini, proyek bisa berkembang bertahap dari data dummy, simulator lokal, API penerimaan data, dashboard operasional, sampai deployment internal tanpa harus mengganti arah arsitektur di tengah jalan.

## Rencana Fitur Utama

### Dashboard Operasional

Dashboard dirancang untuk:

- menampilkan daftar lokasi, perangkat, atau tangki;
- menampilkan volume terbaru;
- menampilkan persentase isi tangki;
- menampilkan estimasi durasi operasional;
- menampilkan status aman, waspada, atau kritis;
- membantu pengguna memindai kondisi banyak tangki dengan cepat.

### Halaman Detail Tangki

Halaman detail dirancang untuk:

- menampilkan satu tangki secara lebih lengkap;
- menampilkan telemetri terbaru;
- menampilkan grafik riwayat volume dan persentase;
- menampilkan konfigurasi tangki;
- menampilkan waktu pembacaan terakhir.

### API Penerimaan Telemetri

API penerimaan telemetri dirancang untuk:

- menerima data dari perangkat atau simulator;
- memvalidasi payload;
- memvalidasi identitas perangkat;
- menormalisasi bagian data telemetri;
- menyimpan data mentah dan data hasil normalisasi;
- memberi respons yang jelas saat data diterima atau ditolak.

### Simulator

Simulator dirancang untuk:

- menghasilkan data dummy;
- mensimulasikan konsumsi bahan bakar;
- mensimulasikan pengisian ulang;
- mensimulasikan perangkat offline atau data stale;
- membantu pengembangan dashboard tanpa menunggu perangkat fisik.

### Status dan Peringatan

Status sistem dirancang untuk:

- menghitung estimasi durasi operasional;
- membedakan status aman, waspada, dan kritis;
- membedakan data terbaru dan data yang sudah terlalu lama;
- menjadi dasar fitur notifikasi di tahap berikutnya.

## Arsitektur Tingkat Tinggi

Alur utama yang direncanakan:

```text
Perangkat IoT atau Simulator
  -> API Penerimaan Telemetri
  -> Validasi Payload
  -> Normalisasi Data
  -> Penyimpanan
  -> Pembacaan Data Dashboard
  -> Tampilan Web dan Grafik
```

Dashboard tidak membaca sensor secara langsung. Perangkat atau simulator mengirim data ke API, kemudian dashboard membaca data yang sudah dibersihkan dari server.

## Teknologi yang Digunakan

Teknologi saat ini:

- Next.js 16 dengan App Router;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Recharts untuk visualisasi data;
- lucide-react untuk ikon antarmuka;
- Vitest untuk pengujian logika;
- pnpm sebagai pengelola paket.

Paket baru hanya akan ditambahkan jika benar-benar dibutuhkan pada fase implementasi.

## Struktur Repositori

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── database/
│   ├── migrations/
│   └── seed/
├── deploy/
│   ├── caddy/
│   ├── docker/
│   ├── self-hosted/
│   └── vercel/
├── docs/
│   ├── api/
│   ├── decisions/
│   ├── deployment/
│   ├── domain/
│   ├── operations/
│   ├── references/
│   ├── architecture.md
│   ├── api-contract.md
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
├── examples/
│   ├── api-clients/
│   ├── curl/
│   └── payloads/
├── firmware/
│   ├── docs/
│   ├── nodemcu/
│   └── simulator/
├── public/
├── references/
│   └── existing-system-audit/
├── scripts/
│   ├── data/
│   ├── dev/
│   └── verification/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── alerts/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── settings/
│   │   ├── sites/
│   │   └── tanks/
│   ├── components/
│   ├── data/
│   ├── features/
│   ├── lib/
│   ├── server/
│   └── types/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── integration/
│   └── unit/
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── package.json
└── README.md
```

## Penjelasan Folder Penting

| Folder | Fungsi |
|---|---|
| `src/app` | Route Next.js, termasuk halaman dashboard dan API route |
| `src/components` | Komponen UI yang bisa digunakan ulang |
| `src/features` | Modul fitur seperti telemetri, tangki, simulator, runtime, dan alert |
| `src/lib` | Helper, perhitungan, validasi, konfigurasi, dan logika domain |
| `src/server` | Service, repositori data, dan use-case server-side |
| `src/data` | Data dummy, fixture, dan seed lokal |
| `tests` | Pengujian unit, pengujian integrasi, dan pengujian e2e |
| `docs` | Dokumentasi teknis dan operasional |
| `examples` | Contoh payload, curl, dan API client |
| `firmware` | Catatan dan contoh firmware yang aman untuk publik |
| `deploy` | Catatan deployment untuk berbagai target |
| `database` | Migration dan seed database |

## Menjalankan di Lokal

Pasang paket:

```powershell
pnpm install
```

Jalankan server pengembangan:

```powershell
pnpm dev
```

Buka aplikasi:

```text
http://localhost:3000
```

Jalankan lint:

```powershell
pnpm lint
```

Jalankan pengecekan tipe:

```powershell
pnpm typecheck
```

Jalankan pengujian:

```powershell
pnpm test
```

Jalankan semua pengecekan lokal:

```powershell
pnpm check
```

Buat build aplikasi:

```powershell
pnpm build
```

## Variabel Lingkungan

Salin file contoh variabel lingkungan:

```powershell
Copy-Item .env.example .env.local
```

File `.env.example` hanya berisi contoh nama variabel. Nilai asli untuk database, API key, token, dan rahasia deployment tidak boleh disimpan di Git.

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm dev` | Menjalankan server pengembangan |
| `pnpm build` | Membuat production build |
| `pnpm start` | Menjalankan hasil production build secara lokal |
| `pnpm lint` | Menjalankan ESLint |
| `pnpm typecheck` | Menjalankan pengecekan tipe TypeScript |
| `pnpm test` | Menjalankan pengujian dengan Vitest |
| `pnpm test:watch` | Menjalankan pengujian Vitest dalam mode pantau |
| `pnpm check` | Menjalankan typecheck, lint, test, dan build |

## Peta Dokumentasi

| Dokumen | Isi yang direncanakan |
|---|---|
| `docs/architecture.md` | Arsitektur sistem dan batas runtime |
| `docs/api-contract.md` | Kontrak permintaan dan respons API |
| `docs/data-model.md` | Model data perangkat, tangki, telemetri, dan status |
| `docs/device-ingestion.md` | Format payload perangkat dan aturan penerimaan data |
| `docs/domain-model.md` | Perhitungan volume, runtime, dan status |
| `docs/deployment.md` | Catatan deployment lokal, demo, dan self-hosted |
| `docs/safety-and-limitations.md` | Batasan, kalibrasi, dan keselamatan |
| `docs/roadmap.md` | Rencana pengembangan bertahap |
| `docs/reviewer-quickstart.md` | Panduan cepat untuk reviewer |
| `docs/decision-log.md` | Catatan keputusan engineering |
| `docs/development-log.md` | Catatan perkembangan implementasi |
| `docs/system-boundaries.md` | Batas hal yang masuk dan tidak masuk repositori |

## Roadmap Pengembangan

### Fase 1 - Fondasi Repositori

- Merapikan README.
- Menyiapkan struktur folder.
- Menyiapkan dokumen repositori dasar.
- Menetapkan batas aman untuk repositori publik.

### Fase 2 - Logika Domain

- Membuat fungsi perhitungan volume tangki.
- Membuat estimasi durasi operasional.
- Membuat klasifikasi status.
- Menulis pengujian unit untuk logika kritis.

### Fase 3 - Dashboard Dummy

- Menambahkan data dummy.
- Mengganti halaman starter menjadi dashboard awal.
- Menampilkan status, volume, runtime, dan riwayat sederhana.

### Fase 4 - Simulator Telemetri

- Membuat generator data telemetri lokal.
- Mensimulasikan konsumsi normal.
- Mensimulasikan pengisian ulang.
- Mensimulasikan kondisi offline atau data stale.

### Fase 5 - API Penerimaan Telemetri

- Membuat endpoint penerimaan telemetri.
- Menambahkan validasi payload.
- Menambahkan normalisasi bagian data.
- Menyimpan data mentah dan data hasil normalisasi.

### Fase 6 - Kesiapan Deployment

- Menulis catatan deployment demo.
- Menulis catatan deployment self-hosted.
- Menambahkan checklist keamanan.
- Menambahkan checklist operasional.

## Batasan dan Keselamatan

Repositori ini belum siap produksi.

Sebelum dipakai untuk perangkat dan tangki nyata, perlu validasi:

- pemasangan perangkat;
- karakteristik sensor;
- bentuk dan dimensi tangki;
- metode kalibrasi;
- toleransi kesalahan pengukuran;
- kebijakan jaringan;
- autentikasi dan otorisasi;
- backup data;
- monitoring server;
- prosedur operasional.

Demo publik tidak boleh memakai telemetri nyata, kredensial, detail lokasi sensitif, alamat jaringan internal, atau konfigurasi produksi.

## Pemelihara dan Kontributor

| Nama | Peran | Profil |
|---|---|---|
| Muhammad Zaenal Abidin Abdurrahman | Pengelola proyek dan pengembangan awal sistem monitoring | - |
| Yattaqi Muazirul Mulki | Kolaborator pengembangan aplikasi | [ukiirving](https://github.com/ukiirving) |

Peran kontribusi dapat disesuaikan mengikuti kebutuhan pengembangan proyek.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat `LICENSE` untuk detail.
