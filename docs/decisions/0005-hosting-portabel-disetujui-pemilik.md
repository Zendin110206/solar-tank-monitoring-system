# ADR 0005 — Aplikasi portabel dan hosting yang disetujui pemilik layanan

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Aplikasi pilot berjalan di layanan hosting awan dan alamatnya tertanam di firmware perangkat v1.
- Hosting jangka panjang perlu dimiliki dan disetujui pemilik layanan, dengan akun yang tidak bergantung pada satu orang.
- Kode FTM tidak memakai fitur khusus penyedia hosting, sehingga bisa dikemas dalam kontainer.

## Keputusan

Aplikasi dibuat portabel: bisa dijalankan sebagai kontainer Docker di host yang disetujui pemilik layanan, dengan nama host milik institusi. Hosting sekarang diperlakukan sebagai jembatan bertanggal sampai perangkat lama berpindah alamat. Tidak ada biaya langganan baru tanpa anggaran resmi.

## Pilihan yang dipertimbangkan

### Tetap di hosting sekarang tanpa batas waktu

- Kelebihan: Tidak ada pekerjaan migrasi.
- Kekurangan: Bergantung pada satu akun dan satu penyedia.
- Hasil: Tidak dipilih.

### Host yang disetujui pemilik layanan + kontainer

- Kelebihan: Berkelanjutan dan dimiliki institusi.
- Kekurangan: Butuh keputusan dan penyediaan host.
- Hasil: Diusulkan.

## Konsekuensi

- Paket kerja hosting (kontainer, pekerja terjadwal, perpindahan bertahap) dikerjakan terpisah dari perapian kode.

## Risiko dan mitigasi

- Risiko: Data putus saat pindah host.
  - Mitigasi: Perpindahan bertahap: dashboard dulu, perangkat v2 berikutnya; alamat lama tetap hidup sampai perangkat terakhir pindah.

## Cara meninjau ulang

Bila pemilik layanan menyediakan platform terkelola.
