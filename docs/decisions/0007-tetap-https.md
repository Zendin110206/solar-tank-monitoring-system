# ADR 0007 — Tetap HTTPS; MQTT hanya bila terbukti perlu

- **Status:** Diusulkan — belum disetujui
- **Tanggal:** 2026-10-25 (diusulkan)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Perangkat mengirim lewat HTTPS. MQTT (protokol pesan untuk IoT) butuh *broker* yang selalu menyala.
- Belum ada bukti terukur bahwa MQTT lebih hemat untuk pola kirim FTM.

## Keputusan

Tetap HTTPS. Pengiriman berkelompok dan adaptif ditambahkan lewat kontrak v2. MQTT hanya dipertimbangkan bila pengukuran membuktikan manfaatnya dan ada host *broker* yang disetujui.

## Pilihan yang dipertimbangkan

### MQTT sekarang

- Kelebihan: Koneksi ringan untuk banyak perangkat.
- Kekurangan: Butuh broker selalu aktif; belum terbukti hemat.
- Hasil: Tidak dipilih sekarang.

### Tetap HTTPS + v2

- Kelebihan: Tidak butuh komponen baru.
- Kekurangan: Setiap kiriman tetap satu permintaan HTTP.
- Hasil: Diusulkan.

## Konsekuensi

- Tidak ada komponen broker di arsitektur sampai pemicu tercapai.

## Risiko dan mitigasi

- Risiko: Kuota permintaan hosting habis bila perangkat bertambah.
  - Mitigasi: Kiriman berkelompok dan interval yang diatur server di v2.

## Cara meninjau ulang

Bila pengukuran energi menunjukkan MQTT jauh lebih hemat dan ada host broker yang sah.
