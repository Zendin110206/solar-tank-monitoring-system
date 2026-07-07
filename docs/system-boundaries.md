# Batas Sistem

Dokumen ini menjelaskan hal yang masuk dan tidak masuk ke repositori.

## Masuk Scope Saat Ini

Yang masuk:

- landing page;
- dashboard awal;
- detail tangki awal;
- data dummy public-safe;
- API read-only;
- API ingest lokal;
- normalisasi payload;
- simulator terminal;
- memory store development;
- fondasi MySQL reading;
- registry MySQL untuk site, tangki, device, dan hash key;
- template registry pilot yang public-safe;
- script validasi/apply registry pilot lokal;
- script smoke test payload real-format;
- validasi key per device untuk data dummy;
- auth database untuk login, session, OTP admin, reset password, email verification, Telegram binding, audit auth, dan rate limit;
- pengajuan perangkat baru dari user;
- review pengajuan perangkat dari admin lewat web;
- pembuatan device key dan paket firmware ZIP setelah approval;
- first valid ping activation;
- cleanup data monitoring/device/uji oleh admin tanpa menghapus akun;
- unit test;
- dokumentasi Bahasa Indonesia.

## Belum Masuk Scope Saat Ini

Yang belum masuk:

- database production lengkap;
- konfigurasi auth production final, termasuk SMTP, CAPTCHA, backup, dan prosedur recovery;
- role operasional yang lebih rinci di luar `admin` dan `user`;
- firmware final yang sudah hardening TLS dan one-click compile;
- deployment production;
- data real di Git;
- alert operasional level kritis/offline;
- approval/reject device lewat Telegram;
- integrasi hardware yang sudah dikalibrasi final;
- integrasi RTU/Modbus/OPNIMUS;
- detail deployment production final;
- laporan PDF;
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
Repositori ini adalah prototipe sistem monitoring tangki berbasis web dengan API ingest lokal dan simulator.
```

Klaim yang belum boleh:

```text
Sistem sudah production-ready.
Sistem sudah dipakai operasional.
Sensor sudah aman untuk tangki nyata.
Data real sudah final dan tervalidasi lapangan.
Deployment internal sudah final.
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

Fondasi MySQL yang ada saat ini belum berarti seluruh sistem sudah siap production.

Yang sudah masuk:

- migration tabel monitoring;
- seed demo;
- penyimpanan reading;
- query riwayat terbaru.
- registry site, tangki, device, dan hash key;
- script apply registry pilot dari file lokal yang tidak di-commit.
- tabel auth, session, OTP, audit, dan rate limit;
- tabel pengajuan perangkat, firmware package, hardware profile, firmware template, event provisioning, dan event ingest.

Yang belum final:

- rotasi key device dari UI admin;
- backup dan restore;
- role operasional lebih rinci;
- SOP pemisahan data dummy dan data real untuk operasional harian.
- monitoring server dan alerting.
