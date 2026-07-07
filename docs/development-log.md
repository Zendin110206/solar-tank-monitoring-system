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

## 2026-06-26 - Persistent Storage Foundation

Pekerjaan:

- migration MySQL untuk site, tank, device, dan reading;
- seed demo MySQL;
- repository MySQL untuk reading;
- storage facade untuk memilih memory atau MySQL;
- query reading awal memakai batas global untuk fondasi storage;
- memory store tetap tersedia untuk development lokal, tetapi mode MySQL tidak menampilkan data dummy ketika tabel reading kosong.

## 2026-06-26 - Auto-refresh Dashboard dan Detail

Pekerjaan:

- komponen refresh manual;
- pause/resume auto-refresh;
- auto-refresh berhenti saat tab tidak aktif;
- interval default 20 detik lewat env;
- jam dashboard real-time sebagai client component kecil.

## 2026-06-26 - Device Key Per Device

Pekerjaan:

- hash key per device dummy;
- validasi key ingest memakai hash;
- fallback global tetap tersedia untuk development;
- simulator memakai key demo sesuai device;
- test device key ditambahkan.

## 2026-06-27 - Deployment Readiness

Pekerjaan:

- menambahkan `GET /api/health` untuk mengecek aplikasi hidup tanpa menyentuh database;
- menambahkan `GET /api/ready` untuk mengecek kesiapan storage aktif;
- menambahkan probe MySQL langsung agar readiness tidak tertutup fallback memory;
- menambahkan error boundary dashboard dan detail tangki;
- memperjelas pesan error bahwa perubahan `.env.local` perlu restart dev server;
- menambahkan test deployment probes;
- menyinkronkan README, kontrak API, deployment, arsitektur, dan quickstart reviewer.

## 2026-06-28 - Cloud MySQL dan Navigasi Detail STO

Pekerjaan:

- memisahkan registry site, tangki, device, dan hash key ke repository MySQL;
- membuat dashboard, detail, dan API membaca registry aktif dari memory atau MySQL;
- menambahkan script `pnpm db:migrate:mysql`, `pnpm db:seed:mysql`, dan `pnpm db:setup:mysql`;
- menambahkan konfigurasi `MYSQL_CONNECTION_LIMIT`, `MYSQL_SSL_MODE`, dan `MYSQL_SSL_CA` untuk deployment cloud MySQL;
- menjaga query reading MySQL mengambil data kronologis untuk grafik detail;
- membuat marker STO dan tabel dashboard bisa membuka halaman detail tangki terkait;
- membuat marker lokasi di halaman detail bisa pindah ke detail STO lain;
- menghapus payload sementara dari working tree agar tidak ikut commit.

## 2026-06-30 - Payload Real Device dan Pilot Readiness

Pekerjaan:

- menambahkan review config payload vs registry agar sistem tidak diam-diam percaya config dari device jika berbeda jauh;
- menambahkan sumber data pembacaan seperti volume dari device atau backend;
- menambahkan panel review config di detail tangki;
- menambahkan `config/pilot-registry.example.json` sebagai template public-safe;
- menambahkan `pnpm pilot:hash-key` untuk membuat key dan hash device;
- menambahkan `pnpm pilot:registry` untuk validasi dan apply registry pilot lokal ke MySQL;
- menambahkan `pnpm pilot:smoke` untuk mengirim payload real-format ke `/api/ingest`;
- menambahkan dokumentasi `docs/pilot-readiness.md`.

Catatan:

```text
Data real, key asli, koordinat sensitif, dan file registry lokal tidak boleh di-commit. Jalur pilot memakai file .local.json yang diabaikan Git.
```

## 2026-06-30 - Fase Peta Real dan Panduan Lapangan

Pekerjaan:

- mengganti peta ilustratif dashboard menjadi peta berbasis tile dan koordinat registry;
- menambahkan zoom, drag, recenter, search, filter status, tooltip marker, dan detail overview interaktif;
- menambahkan latitude dan longitude ke dashboard view model agar API dan UI membawa posisi registry;
- menambahkan `docs/field-pilot-5-sto-guide.md` sebagai panduan lapangan untuk 5 STO;
- menegaskan bahwa marker peta berasal dari registry manual, bukan payload GPS device.

## 2026-07-06 - Maintenance Data Device/Uji

Pekerjaan:

- menambahkan panel admin untuk membersihkan satu data device/uji, beberapa pilihan, atau semua data device/uji sebelum uji real diulang;
- membatasi pembersihan hanya ke data operasional monitoring dan provisioning;
- menjaga pembersihan pilihan agar site/tangki yang masih dipakai data lain tidak ikut terhapus;
- menjaga akun admin/user, audit auth, template firmware, dan profil hardware tetap tersimpan;
- menambahkan konfirmasi manual agar admin tidak menghapus data tanpa sengaja;
- menambahkan test repository untuk memastikan urutan pembersihan mengikuti relasi database;
- memperbarui README, pilot readiness, dan data model.

## 2026-07-07 - Sinkronisasi Dokumentasi Operasional

Pekerjaan:

- menambahkan `docs/current-operational-truth.md` sebagai sumber ringkas kondisi project terkini;
- menyelaraskan README, SECURITY, deployment, safety, system boundaries, data model, dan roadmap agar tidak menyebut fitur yang sudah ada sebagai belum ada;
- menegaskan bahwa approval device tetap melalui web admin, sementara Telegram masih untuk binding/notifikasi;
- menegaskan bahwa RTU/Modbus, alert production, backup/restore teruji, dan hardening deployment final masih pekerjaan lanjutan;
- mencatat bahwa kapasitas tangki dan konsumsi estimasi berasal dari perhitungan sistem, bukan input manual bebas user.

Catatan:

```text
Perubahan ini hanya dokumentasi. Detail deployment pilihan akhir tidak dipublikasikan di repo utama pada tahap ini.
```

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
