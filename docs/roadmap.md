# Roadmap

Roadmap ini menjelaskan rencana pengembangan bertahap.

## Fase 1 - Fondasi Repositori

Status: selesai.

Isi:

- Next.js project;
- TypeScript;
- Tailwind CSS;
- struktur dokumentasi;
- aturan keamanan publik;
- CI dasar.

## Fase 2 - Landing Page

Status: selesai untuk versi awal.

Isi:

- landing page Bahasa Indonesia;
- gaya visual bersih;
- konteks monitoring tangki;
- tombol masuk dashboard.

## Fase 3 - Dashboard dan Detail Dummy

Status: selesai untuk versi awal.

Isi:

- halaman dashboard;
- halaman detail tangki;
- peta ilustratif;
- kartu status;
- tabel monitoring;
- visual tangki.

Catatan:

```text
UI dashboard dan detail sudah membaca memory store lokal yang sama dengan endpoint API. Tahap berikutnya adalah storage permanen.
```

## Fase 4 - Domain Logic dan Test

Status: selesai untuk versi awal.

Isi:

- model data monitoring;
- perhitungan volume;
- runtime;
- status;
- normalisasi payload;
- unit test.

## Fase 5 - API dan Simulator Lokal

Status: selesai untuk versi awal.

Isi:

- API read-only;
- API ingest;
- memory store;
- simulator terminal;
- verifikasi payload masuk;
- history bertambah.

## Fase 6 - Sambungkan UI ke Memory Store/API Lokal

Status: selesai untuk versi awal.

Isi:

- dashboard membaca data terbaru dari memory store;
- detail membaca data terbaru dari memory store;
- grafik memakai riwayat yang sama dengan endpoint readings;
- UI berubah saat simulator mengirim data lalu halaman dirender ulang;
- endpoint API tetap tersedia untuk kontrak integrasi.

## Fase 7 - Storage Permanen

Target:

- pilih database lokal atau Postgres;
- simpan reading permanen;
- siapkan migration;
- siapkan seed data;
- pisahkan data contoh dan data storage;
- tambah test integrasi dasar.

## Fase 8 - Auth dan Role

Target:

- login;
- role admin/operator/viewer;
- proteksi dashboard;
- audit log sederhana;
- aturan akses per fitur.

## Fase 9 - Integrasi Device Fisik

Target:

- sepakati payload firmware;
- key per device;
- interval kirim;
- uji di lingkungan aman;
- validasi akurasi sensor;
- dokumentasi provisioning device.

## Fase 10 - Deployment Demo atau Pilot

Target:

- deployment demo public-safe;
- atau deployment internal/self-hosted;
- env var aman;
- HTTPS;
- backup;
- monitoring dasar;
- checklist operasional.

## Prinsip Roadmap

- Jangan menambah fitur besar sebelum alur data inti stabil.
- Jangan memakai data real sebelum keamanan siap.
- Jangan mengklaim production-ready sebelum validasi lapangan.
- Setiap fase harus bisa diuji dari terminal.
