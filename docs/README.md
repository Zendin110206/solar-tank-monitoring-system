# Dokumentasi FTM

Indeks semua dokumen di folder ini: tujuan, status, dan tanggal terakhir diperiksa.

Arti status:

- **Terkini**: sudah dicocokkan dengan kode pada tanggal yang tertulis.
- **Perlu diperiksa ulang**: isinya kemungkinan besar masih benar, tetapi belum
  dicocokkan lagi dengan kode terbaru.
- **Riwayat**: catatan masa lalu yang disimpan apa adanya; jangan dipakai sebagai
  acuan kondisi sekarang.

## Mulai dari sini

| Dokumen | Isi | Status | Diperiksa |
|---|---|---|---|
| [../README.md](../README.md) | Gambaran FTM, cara menjalankan lokal, perintah | Terkini | 25 Okt 2026 |
| [current-operational-truth.md](current-operational-truth.md) | Status operasional bertanggal | Terkini (bagian Oktober 2026) | 25 Okt 2026 |
| [architecture.md](architecture.md) | Arsitektur, modul, lapisan, alur data | Terkini | 25 Okt 2026 |
| [decisions/](decisions/README.md) | Catatan keputusan arsitektur (ADR) | Terkini | 25 Okt 2026 |

## Acuan teknis

| Dokumen | Isi | Status | Diperiksa |
|---|---|---|---|
| [api-contract.md](api-contract.md) | Endpoint API dan bentuk datanya, termasuk kontrak perangkat v1 | Perlu diperiksa ulang | 14 Jul 2026 |
| [device-ingestion.md](device-ingestion.md) | Cara data perangkat masuk, autentikasi, normalisasi | Perlu diperiksa ulang | 14 Jul 2026 |
| [data-model.md](data-model.md) | Tabel dan hubungan data | Perlu diperiksa ulang | 14 Jul 2026 |
| [domain-model.md](domain-model.md) | Rumus volume, status, dan sisa jam genset | Perlu diperiksa ulang | 14 Jul 2026 |
| [database-backup.md](database-backup.md) | Skrip backup dan batas pemulihan | Perlu diperiksa ulang | 8 Jul 2026 |
| [deployment.md](deployment.md) | Variabel lingkungan, migrasi, kesiapan | Perlu diperiksa ulang | 14 Jul 2026 |
| [safety-and-limitations.md](safety-and-limitations.md) | Batas perangkat lunak, data, dan perangkat fisik | Perlu diperiksa ulang | 14 Jul 2026 |
| [system-boundaries.md](system-boundaries.md) | Yang masuk dan tidak masuk repositori | Perlu diperiksa ulang | 14 Jul 2026 |
| [reviewer-quickstart.md](reviewer-quickstart.md) | Langkah cepat memeriksa repositori | Perlu diperiksa ulang | 14 Jul 2026 |

## Panduan pengguna

| Dokumen | Isi | Status | Diperiksa |
|---|---|---|---|
| [panduan-user-manual-ftm.pdf](panduan-user-manual-ftm.pdf) / [.html](panduan-user-manual-ftm.html) | Panduan bagi pengguna dashboard | Perlu diperiksa ulang | Juli 2026 |

## Riwayat

| Dokumen | Isi | Status | Tanggal |
|---|---|---|---|
| [decision-log.md](decision-log.md) | Keputusan teknis Juni–Juli 2026 (penggantinya: [ADR](decisions/README.md)) | Riwayat | 14 Jul 2026 |
| [development-log.md](development-log.md) | Catatan perkembangan implementasi | Riwayat | 14 Jul 2026 |
| [roadmap.md](roadmap.md) | Rencana fase pengembangan versi Juli | Riwayat | 14 Jul 2026 |
| [pilot-readiness.md](pilot-readiness.md) | Rencana perluasan pilot menuju 5 STO | Riwayat | 14 Jul 2026 |
| [field-pilot-5-sto-guide.md](field-pilot-5-sto-guide.md) | Panduan lapangan perluasan pilot | Riwayat | 14 Jul 2026 |

## Aturan dokumentasi

- Bahasa Indonesia yang wajar; istilah teknis dijelaskan singkat di tempat munculnya.
- Setiap pernyataan tentang pilot menyebut tanggal ("per Oktober 2026").
- Rencana tidak ditulis seolah sudah tercapai.
- Dokumen basi diperbarui atau ditandai riwayat; informasi tidak dihapus tanpa
  penunjuk ke tempat barunya.
- Tidak ada data pribadi, kredensial, kode lokasi, atau koordinat.
