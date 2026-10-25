# ADR 0006 — Kontrak perangkat berversi: v1 dibekukan, v2 ditambahkan

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Perangkat terpasang mengirim ke `/api/ingest` dengan format tanpa nomor versi. Firmware v1 tidak mengikuti redirect, hanya menganggap HTTP 200/201 sebagai sukses, dan mengabaikan isi balasan.
- Mengubah format atau alamat v1 berarti mengunjungi setiap lokasi untuk memasang ulang firmware.

## Keputusan

Kontrak v1 (path, header, isi kiriman, kode status, isi balasan, dan paket firmware yang dihasilkan) dibekukan dan dilindungi tes. Kontrak v2 ditambahkan di samping v1, bukan menggantikannya. v2 membawa `schema_version`, `firmware_version`, nomor urut `seq`, waktu ukur `measured_at`, dukungan kiriman berkelompok, dan balasan berisi konfigurasi (misalnya interval kirim). Server menjadi satu-satunya penghitung volume.

## Pilihan yang dipertimbangkan

### Mengubah v1 di tempat

- Kelebihan: Satu format saja.
- Kekurangan: Merusak perangkat yang sudah terpasang.
- Hasil: Tidak dipilih.

### v1 beku + v2 di sampingnya

- Kelebihan: Perangkat lama aman; perangkat baru mendapat fitur.
- Kekurangan: Server melayani dua versi selama transisi.
- Hasil: Diusulkan.

## Konsekuensi

- Tes kontrak v1 menjadi syarat setiap perubahan di jalur penerimaan data.

## Risiko dan mitigasi

- Risiko: v2 tidak cocok dengan firmware baru.
  - Mitigasi: Uji lab sebelum perangkat lapangan dipasang ulang.

## Cara meninjau ulang

Setiap kali format kiriman perlu berubah.
