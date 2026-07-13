# Decision Log

Dokumen ini mencatat keputusan teknis penting agar alasan perubahan tetap bisa dilacak.

## 2026-06-24 - Gunakan Next.js App Router

Keputusan:

```text
Frontend dan API prototipe dibuat dalam satu aplikasi Next.js.
```

Alasan:

- mudah dijalankan lokal;
- cocok untuk iterasi cepat;
- API route cukup untuk MVP;
- deployment demo lebih sederhana.

Catatan:

Jika kebutuhan backend bertambah besar, service backend dapat dipisah nanti.

## 2026-06-25 - Pisahkan Domain Logic dari UI

Keputusan:

```text
Perhitungan volume, runtime, status, dan normalisasi payload ditempatkan di src/features/monitoring/lib.
```

Alasan:

- angka operasional harus bisa dites;
- UI tidak boleh menjadi tempat rumus utama;
- logic bisa dipakai API dan UI.

## 2026-06-25 - Gunakan Data Dummy Public-safe

Keputusan:

```text
Semua data awal memakai data contoh.
```

Alasan:

- aman untuk repo publik;
- tidak membuka data internal;
- cukup untuk membangun UI dan API.

## 2026-06-26 - Tambah API Ingest dan Memory Store

Keputusan:

```text
POST /api/ingest menerima payload device dan menyimpan reading ke memory store.
```

Alasan:

- membuktikan alur data tanpa database;
- memudahkan uji simulator;
- mengurangi blocker dari hardware.

Batasan:

Data hilang saat dev server restart.

## 2026-06-26 - Tambah Simulator Terminal

Keputusan:

```text
Simulator dibuat sebagai scripts/simulate-device.mjs tanpa dependency tambahan.
```

Alasan:

- mudah dijalankan;
- tidak perlu build step;
- ringan;
- cocok untuk pembelajaran terminal.

## 2026-06-26 - Hapus Placeholder Berlebih

Keputusan:

```text
Folder kosong berbasis .gitkeep dibersihkan dari struktur Git.
```

Alasan:

- repo lebih mudah dibaca;
- struktur mencerminkan file nyata;
- roadmap tetap dicatat di dokumentasi, bukan folder kosong.

## 2026-06-26 - Pisahkan Storage Memory dan MySQL

Keputusan:

```text
telemetry-store.ts dipertahankan untuk mode development lokal, sedangkan query MySQL dipindah ke mysql-reading-repository.ts dan dipilih lewat monitoring-storage.ts. Saat mode MySQL aktif, tabel reading kosong tidak lagi diisi dari data dummy agar dashboard pilot/production tidak menampilkan data simulasi sebagai data lapangan.
```

Alasan:

- file tidak terlalu gemuk;
- mode development tetap sederhana;
- query database lebih mudah diaudit;
- mode storage bisa diganti lewat env tanpa mengubah page.

Catatan:

Query MySQL awal mengambil reading terbaru global lalu dibalik untuk grafik. Setelah data real makin banyak, overview memakai query reading terbaru per tangki, sedangkan history detail memakai query khusus tank agar tidak terpotong oleh data tank lain.

## 2026-06-26 - Tambah Key Per Device

Keputusan:

```text
API ingest menerima key per device yang divalidasi terhadap hash, dengan fallback global hanya untuk development.
```

Alasan:

- lebih dekat ke kebutuhan perangkat nyata;
- tidak semua device bergantung pada satu key global;
- fallback lokal tetap membantu latihan awal.

Catatan:

Untuk mode yang lebih dekat pilot atau production, `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` harus diset `false`.

## 2026-06-26 - Gunakan Client Component Kecil untuk Real-time UI

Keputusan:

```text
Dashboard dan detail tetap Server Component, sedangkan refresh control dan jam real-time dibuat sebagai Client Component kecil.
```

Alasan:

- menjaga JavaScript client tetap ringan;
- data tetap dibaca di server;
- interaksi browser seperti timer dan visibility state tetap berjalan benar.

## 2026-07-11 - Pisahkan Snapshot Live dan History Rollup 5 Menit

Keputusan:

```text
Telemetry MySQL setiap ±20 detik memperbarui satu snapshot terbaru per device,
sedangkan history hanya menambah satu bucket agregat setiap 5 menit.
```

Alasan:

- dashboard tetap menampilkan data terbaru tanpa menunggu bucket selesai;
- pertumbuhan row history berkurang sekitar 15 kali dibanding raw 20 detik;
- mean tetap didampingi min, max, dan sample count agar lonjakan singkat tidak hilang;
- kedua upsert berada dalam satu transaksi supaya snapshot dan history tidak berbeda diam-diam;
- raw history lama tidak dihapus otomatis agar migrasi tidak merusak data audit.

Catatan kompatibilitas:

Overview dan detail membandingkan snapshot dengan history terbaru berdasarkan
`receivedAt`. Ini mencegah status berbeda ketika database sudah dimigrasi tetapi
deployment lama masih menulis raw selama rollout.

## 2026-07-14 - Gunakan Urutan Regional, Wilayah, Area, dan STO

Keputusan:

```text
Setiap STO dikelompokkan sebagai Regional -> Wilayah -> Area -> STO.
```

Alasan:

- daftar tetap mudah dicari ketika jumlah STO bertambah lintas area;
- istilah lokasi konsisten antara pengajuan perangkat, dashboard, peta, paket firmware, dan registry pilot;
- perangkat tidak perlu mengirim nama lokasi pada setiap reading karena server mengambilnya dari registry;
- lokasi pilot lama memakai nilai awal `TREG 5` dan `TIF 3` agar perubahan database tidak membuat data yang sudah ada hilang.

Catatan: daftar pilihan saat ini mengikuti kebutuhan pilot yang sudah disetujui.
Penambahan Regional/Wilayah baru harus memakai data organisasi resmi, bukan
perkiraan pengembang.
