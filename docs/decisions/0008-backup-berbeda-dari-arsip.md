# ADR 0008 — Backup berbeda dari arsip

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Backup database belum berjalan otomatis dan pemulihannya belum pernah diuji.
- Arsip (memindahkan data lama keluar dari database) sering disamakan dengan backup, padahal tujuannya berbeda.

## Keputusan

Backup = salinan penuh untuk pemulihan: harian, terenkripsi, dengan uji pulih bulanan (pulihkan ke database terpisah lalu cocokkan jumlah baris). Arsip = data lama yang dipindah ke penyimpanan resmi yang disetujui pemilik data. Tidak ada data yang dihapus sebelum arsipnya terverifikasi lengkap.

## Pilihan yang dipertimbangkan

### Arsip ke penyimpanan pribadi lalu hapus setelah unggah

- Kelebihan: Murah.
- Kekurangan: Tidak sah dan tidak bisa dipulihkan dengan pasti.
- Hasil: Tidak dipilih.

### Backup terenkripsi + uji pulih + arsip resmi

- Kelebihan: Pemulihan terbukti.
- Kekurangan: Butuh pekerja terjadwal dan izin pemilik data.
- Hasil: Diusulkan.

## Konsekuensi

- Prosedur backup dan uji pulih ditulis sebagai *runbook* (panduan langkah demi langkah).

## Risiko dan mitigasi

- Risiko: File backup berisi data pribadi.
  - Mitigasi: Enkripsi dan penyimpanan di lokasi yang disetujui.

## Cara meninjau ulang

Bila pemilik layanan menyediakan backup terkelola yang terbukti bisa dipulihkan.
