# ADR 0010 — Alarm operasional dipisah dari alarm sistem

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Belum ada alarm otomatis. Dashboard yang tidak dibuka tidak memberi tahu siapa pun.
- Notifikasi Telegram yang ada hanya untuk akun baru, perangkat baru, dan helpdesk.

## Keputusan

Alarm dibagi dua. Alarm operasional: solar rendah/kritis dan penurunan mendadak. Alarm sistem: perangkat diam, penerimaan data gagal, database hampir penuh, backup gagal, pekerja mati. Alarm dijalankan proses pekerja terjadwal, dikirim ke topik Telegram berbeda dengan penanggung jawab yang jelas, dan tanpa janji respons 24 jam.

## Pilihan yang dipertimbangkan

### Alarm dari halaman web

- Kelebihan: Tidak butuh proses baru.
- Kekurangan: Hanya berjalan saat halaman dibuka.
- Hasil: Tidak dipilih.

### Alarm dari pekerja terjadwal

- Kelebihan: Berjalan terus.
- Kekurangan: Butuh host yang selalu menyala.
- Hasil: Diusulkan.

## Konsekuensi

- Bergantung pada keputusan host (ADR 0005) dan penetapan penerima alarm.

## Risiko dan mitigasi

- Risiko: Terlalu banyak alarm sehingga diabaikan.
  - Mitigasi: Ambang dan jeda pengulangan yang disepakati bersama penerima.

## Cara meninjau ulang

Bila dibutuhkan respons di luar jam kerja (perlu jadwal piket resmi).
