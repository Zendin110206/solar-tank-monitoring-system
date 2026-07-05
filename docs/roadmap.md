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
UI monitoring dan detail sudah membaca storage aktif yang sama dengan endpoint API. Registry MySQL, alat bantu pilot, dan fondasi auth database sudah tersedia, tetapi hardening production masih perlu dimatangkan.
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

## Fase 6 - Sambungkan UI ke Storage Aktif/API Lokal

Status: selesai untuk versi awal.

Isi:

- dashboard membaca data terbaru dari storage aktif;
- detail membaca data terbaru dari storage aktif;
- grafik memakai riwayat yang sama dengan endpoint readings;
- UI berubah saat simulator mengirim data lalu halaman dirender ulang;
- endpoint API tetap tersedia untuk kontrak integrasi.

## Fase 7 - Storage Permanen dan Registry

Status: fondasi reading dan registry selesai untuk prototipe, belum production.

Sudah ada:

- migration MySQL;
- seed demo MySQL;
- repository reading MySQL;
- repository registry MySQL untuk site, tangki, device, dan hash key;
- storage facade `memory` atau `mysql`;
- query mengambil data terbaru terlebih dahulu;
- script apply registry pilot dari file lokal.

Yang belum selesai:

- rotasi key device;
- backup database;
- test integrasi database nyata;
- audit berkala agar data dummy tetap hanya aktif di mode development lokal.

## Fase 8 - Auth dan Role

Status: fondasi utama tersedia, production hardening berlanjut.

Yang sudah tersedia:

- login;
- role `admin` dan `user`;
- proteksi dashboard dan halaman admin;
- pengajuan akses pending review admin;
- OTP admin, reset password, verifikasi email, session management, dan audit log auth.

Yang masih perlu dimatangkan:

- SMTP production;
- Turnstile production;
- role operasional lebih rinci jika memang diperlukan;
- prosedur recovery akun;
- audit review berkala.

## Fase 9 - Integrasi Device Fisik

Status: fondasi payload real-format dan smoke test tersedia, integrasi lapangan tetap perlu validasi.

Sudah ada:

- normalisasi payload real-format;
- review config payload vs registry;
- script smoke test ingest;
- panduan firmware payload minimal;
- alur pengajuan perangkat oleh user;
- review admin untuk approve/reject pengajuan;
- pembuatan device key dan paket firmware ZIP;
- link download firmware dengan masa berlaku dan batas download;
- aktivasi device setelah first valid ping.

Target berikutnya:

- validasi firmware final bersama tim lapangan;
- validasi pin dan hardware profile final;
- uji di lingkungan aman;
- validasi akurasi sensor;
- dokumentasi operasional provisioning device setelah flow final disetujui.

Catatan:

Endpoint ingest dan key per device sudah disiapkan untuk latihan dan pilot awal. Perangkat fisik tetap harus mengikuti validasi payload, jaringan, keamanan, dan safety lapangan.

## Fase 10 - Deployment Demo atau Pilot

Status: jalur Vercel + cloud MySQL tersedia untuk demo/pilot ringan.

Sudah ada:

- health check;
- readiness check;
- panduan MySQL cloud;
- alat registry pilot;
- smoke ingest ke URL lokal atau Vercel.

Target berikutnya:

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
