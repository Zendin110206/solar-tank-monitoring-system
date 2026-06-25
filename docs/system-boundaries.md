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
- unit test;
- dokumentasi Bahasa Indonesia.

## Belum Masuk Scope Saat Ini

Yang belum masuk:

- database production;
- auth final;
- role user;
- firmware final;
- deployment production;
- data real;
- notifikasi;
- integrasi hardware;
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
- payload real;
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
Data real sudah terintegrasi.
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
