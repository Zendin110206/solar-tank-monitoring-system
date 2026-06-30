# Batasan dan Keselamatan

Dokumen ini menjelaskan batas sistem dan hal keselamatan yang harus diperhatikan.

## Status Keamanan Saat Ini

Repositori ini adalah prototipe software.

Belum boleh dianggap:

- production-ready;
- aman untuk perangkat nyata tanpa review;
- siap dipasang di tangki nyata;
- siap menyimpan data operasional sensitif.

## Batas Software

Yang sudah ada:

- data dummy;
- API ingest lokal;
- validasi key per device dengan hash pada data dummy;
- memory store;
- fondasi MySQL untuk reading;
- registry MySQL untuk pilot;
- validasi registry pilot dari file lokal yang tidak di-commit;
- smoke test payload real-format;
- simulator;
- test domain.

Yang belum ada:

- database production lengkap dengan backup;
- auth user final;
- role access;
- rate limit;
- audit log;
- backup;
- monitoring server;
- integrasi hardware real;
- halaman admin untuk mengelola registry device.

## Batas Data

Data di repo harus public-safe.

Jangan masukkan:

- data telemetry real;
- koordinat sensitif;
- domain internal;
- IP internal;
- credential;
- screenshot dashboard internal;
- konfigurasi jaringan;
- API key production.

Untuk pilot, data real boleh dipakai hanya lewat:

- environment variable lokal/Vercel;
- database cloud/server yang memang dituju;
- `config/pilot-registry.local.json` yang di-ignore Git.

File contoh `config/pilot-registry.example.json` tidak boleh dianggap data final
lapangan.

## Batas Hardware

Pemasangan perangkat di sekitar bahan bakar harus mengikuti prosedur resmi.

Jangan:

- memasang sensor sendiri tanpa izin;
- membuka atau mengebor tangki;
- menaruh rangkaian terbuka dekat bahan bakar;
- menguji perangkat di area berisiko tanpa pendamping;
- mengklaim sensor aman sebelum validasi.

Pengujian awal sebaiknya memakai:

- simulator software;
- wadah air;
- lingkungan aman;
- perangkat low voltage;
- pendamping yang memahami prosedur.

## Batas Rumus

Rumus tabung horizontal sudah disiapkan, tetapi hasil nyata tetap perlu kalibrasi.

Yang harus divalidasi:

- diameter tangki;
- panjang tangki;
- kapasitas real;
- posisi sensor;
- blind spot sensor;
- bentuk tangki tidak ideal;
- toleransi error;
- efek permukaan cairan.

## Batas Keputusan Operasional

Dashboard membantu membaca kondisi.

Dashboard tidak menggantikan:

- inspeksi lapangan;
- SOP operasional;
- keputusan teknisi;
- prosedur keselamatan;
- validasi mentor atau penanggung jawab.

## Sebelum Production

Checklist minimum:

- data model disetujui;
- payload device disepakati;
- security review;
- database dan backup;
- HTTPS;
- rate limit;
- role user;
- audit log;
- rotasi key device;
- dokumentasi operasional;
- uji perangkat di lingkungan aman;
- validasi akurasi volume.
