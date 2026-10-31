# ADR 0002 — Satu repositori dan satu aplikasi modular

- **Status:** Diterima
- **Tanggal:** 2026-10-25 (diterima)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- FTM dirawat oleh tim kecil (1–2 pengembang aktif) dan hanya punya satu aplikasi web plus satu templat firmware.
- Beban data rendah: puluhan perangkat × satu kiriman per 20 detik.
- Kerapian bisa dicapai dengan batas modul di dalam satu aplikasi tanpa memecah repositori.

## Keputusan

FTM tetap satu repositori dan satu aplikasi Next.js yang isinya dipisah per modul (_modular monolith_). Modul berada di `src/features/<modul>/`. Arah ketergantungan: halaman/route handler → layanan modul → repositori → koneksi database. Proses pekerja terjadwal di masa depan memakai modul yang sama dari repositori yang sama.

## Pilihan yang dipertimbangkan

### Monorepo dengan beberapa paket (misalnya pnpm workspace + Turborepo)

- Kelebihan: Siap untuk banyak aplikasi.
- Kekurangan: Alat tambahan belum sepadan untuk satu aplikasi dan tim kecil.
- Hasil: Ditunda.

### Repositori terpisah untuk tampilan dan server

- Kelebihan: Batas tim jelas.
- Kekurangan: Dua deployment, dua CI, sinkronisasi versi, dan autentikasi antaraplikasi.
- Hasil: Tidak dipilih.

### Satu repositori, satu aplikasi modular

- Kelebihan: Sederhana; batas tetap jelas lewat struktur folder dan aturan lint.
- Kekurangan: Disiplin lapisan harus dijaga dengan aturan otomatis.
- Hasil: Dipilih.

## Konsekuensi

- Aturan lapisan dicek otomatis dengan ESLint (`no-restricted-imports`).
- Struktur modul rinci dicatat di ADR tersendiri sebelum file dipindah.

## Risiko dan mitigasi

- Risiko: Batas modul kembali kabur seiring waktu.
  - Mitigasi: Aturan lint yang gagal di CI bila halaman mengimpor repositori atau database langsung.

## Cara meninjau ulang

Dibahas ulang bila ada ≥ 2 aplikasi yang berbagi kode atau ≥ 3 pengembang bekerja paralel.
