# ADR 0004 — Tetap MySQL dengan retensi data bertingkat

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Data riwayat disimpan sebagai ringkasan 5 menit per perangkat dan tumbuh terus tanpa batas waktu.
- Paket database yang dipakai pilot berkapasitas kecil (1 GB).
- Pindah ke database deret waktu (misalnya PostgreSQL + TimescaleDB) memberi kompresi dan agregasi otomatis, tetapi biaya migrasinya pasti besar.

## Keputusan

Tetap MySQL. Usulan retensi (berapa lama data disimpan): ringkasan 5 menit disimpan 30 hari dan ringkasan 1 jam disimpan 365 hari di database. Data lama diarsipkan ke penyimpanan resmi sebelum dihapus. Retensi dijalankan oleh proses pekerja terjadwal.

## Pilihan yang dipertimbangkan

### PostgreSQL/TimescaleDB sekarang

- Kelebihan: Fitur deret waktu bawaan.
- Kekurangan: Tulis ulang SQL dan migrasi data; manfaat baru terasa pada data jauh lebih besar.
- Hasil: Tidak dipilih sekarang.

### MySQL tanpa retensi

- Kelebihan: Tanpa pekerjaan tambahan.
- Kekurangan: Database akan penuh.
- Hasil: Tidak dipilih.

### MySQL + retensi bertingkat

- Kelebihan: Muat di kapasitas kecil; tanpa migrasi.
- Kekurangan: Butuh pekerja terjadwal dan persetujuan pemilik data.
- Hasil: Diusulkan.

## Konsekuensi

- Tabel ringkasan 1 jam dan proses arsip dibuat di paket kerja tersendiri.

## Risiko dan mitigasi

- Risiko: Data terhapus sebelum arsip terverifikasi.
  - Mitigasi: Penghapusan hanya setelah arsip dicek ulang lengkap.

## Cara meninjau ulang

Bila riwayat melebihi puluhan juta baris atau kueri tetap lambat setelah indeks dan agregasi.
