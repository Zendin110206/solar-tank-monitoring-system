# ADR 0009 — Akses data dibatasi per lokasi

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Per Oktober 2026 semua akun aktif bisa melihat dan mengekspor data semua lokasi; peran hanya `admin` dan `user`.
- Ekspansi ke lebih banyak area membutuhkan pembatasan sesuai wilayah kerja.

## Keputusan

Setiap akun diberi penugasan ke Regional, Wilayah, Area, atau STO. Penyaringan dilakukan di lapisan repositori (tempat kueri database), bukan hanya di tampilan. Dikerjakan sebelum ekspansi lintas area.

## Pilihan yang dipertimbangkan

### Saring di tampilan saja

- Kelebihan: Cepat.
- Kekurangan: Data tetap bisa diambil lewat API.
- Hasil: Tidak dipilih.

### Saring di repositori

- Kelebihan: Aman untuk halaman dan API.
- Kekurangan: Butuh migrasi data penugasan.
- Hasil: Diusulkan.

## Konsekuensi

- Tes akses lintas lokasi wajib ada.

## Risiko dan mitigasi

- Risiko: Salah penugasan membuat petugas tidak melihat lokasinya.
  - Mitigasi: Tampilan admin untuk memeriksa penugasan dan audit perubahan.

## Cara meninjau ulang

Bila struktur organisasi pengguna berubah.
