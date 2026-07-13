# Batas Sistem

Dokumen ini menjelaskan hal yang masuk dan tidak masuk ke repositori.

## Masuk Scope Saat Ini

Yang masuk:

- landing page;
- dashboard operasional, peta, filter lokasi, dan detail tangki;
- data contoh public-safe khusus development;
- API baca dan API ingest;
- normalisasi payload;
- simulator terminal;
- memory store development;
- snapshot live dan rollup 5 menit MySQL;
- registry MySQL untuk site, tangki, device, dan hash key;
- template registry pilot yang public-safe;
- script validasi/apply registry pilot lokal;
- script smoke test payload real-format;
- validasi key per device untuk data contoh development;
- auth database untuk login, session, OTP admin, reset password, email verification, Telegram binding, audit auth, dan rate limit;
- pengajuan perangkat baru dari user;
- review pengajuan perangkat dari admin lewat web;
- pembuatan device key dan paket firmware ZIP setelah approval;
- first valid ping activation;
- cleanup data monitoring/device/uji oleh admin tanpa menghapus akun;
- export CSV, reset reading, backup MySQL, Telegram, dan helpdesk;
- unit test;
- dokumentasi Bahasa Indonesia.

## Belum Masuk Scope Saat Ini

Yang belum masuk:

- hardening production penuh, termasuk restore drill dan SOP recovery;
- role operasional yang lebih rinci di luar `admin` dan `user`;
- firmware final yang sudah hardening TLS dan one-click compile;
- data real di Git;
- alert operasional level kritis/offline;
- approval/reject device lewat Telegram;
- integrasi hardware yang sudah dikalibrasi final;
- integrasi RTU/Modbus/OPNIMUS;
- detail deployment production final;
- mobile app.

## Tidak Boleh Masuk Repo Publik

Yang tidak boleh masuk:

- folder `local_context`;
- credential;
- API key asli;
- password;
- IP internal;
- domain produksi;
- konfigurasi jaringan privat;
- payload real yang sensitif;
- file registry lokal berisi koordinat/hash asli;
- file backup;
- informasi sensitif lokasi.

## Batas Klaim

Klaim yang aman:

```text
FTM adalah pilot operasional internal yang aktif dengan perangkat, akun,
deployment Vercel, dan database MySQL nyata dalam cakupan terbatas.
```

Klaim yang belum boleh:

```text
Sistem sudah production-ready.
Sistem sudah diterapkan secara nasional.
Seluruh perangkat selalu online.
Sensor sudah aman untuk tangki nyata.
Data real sudah final dan tervalidasi lapangan.
FTM telah mendapat persetujuan formal sebagai sistem produksi Telkom Indonesia.
```

## Batas Brand dan Data Institusi

Dokumentasi publik memakai istilah umum seperti:

- lokasi operasional;
- site;
- STO;
- perangkat;
- tangki;
- dashboard monitoring.

Jangan menaruh detail institusi, jaringan, atau data internal yang belum disetujui.

## Batas Memory Store

Memory store hanya untuk development.

Artinya:

- data hilang saat server restart;
- tidak cocok untuk audit;
- tidak cocok untuk multi-server;
- tidak cocok untuk production.

Storage final harus memakai database.

## Batas MySQL Saat Ini

MySQL sudah dipakai pada pilot, tetapi keberadaan database aktif belum berarti
seluruh sistem siap production.

Yang sudah masuk:

- migration tabel monitoring dan auth;
- seed demo;
- snapshot live dan history agregat 5 menit;
- query dashboard, detail, dan CSV;
- registry site, tangki, device, dan hash key;
- script apply registry pilot dari file lokal yang tidak di-commit.
- tabel auth, session, OTP, audit, dan rate limit;
- tabel pengajuan perangkat, firmware package, hardware profile, firmware template, event provisioning, dan event ingest.

Yang belum final:

- rotasi key device dari UI admin;
- backup terenkripsi dan restore drill;
- role operasional lebih rinci;
- SOP pemisahan data contoh dan data real untuk operasional harian.
- monitoring server dan alerting.
