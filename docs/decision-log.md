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
Semua data awal memakai dummy.
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
