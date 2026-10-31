# Catatan keputusan arsitektur (ADR)

ADR (_Architecture Decision Record_) adalah catatan singkat tentang satu keputusan
penting: konteksnya, keputusan yang diambil, pilihan lain yang dipertimbangkan, dan
akibatnya. Tujuannya agar alasan sebuah keputusan tidak hilang di percakapan.

Keputusan baru ditulis dengan [templat](0000-template.md). Status:

- **Diterima**: berlaku dan wajib diikuti.
- **Diusulkan — belum disetujui**: arah yang direkomendasikan; belum boleh
  dianggap keputusan final sebelum disetujui pemilik layanan.

| ADR                                                | Judul                                                        | Status                      |
| -------------------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| [0001](0001-evolusi-bertahap.md)                   | Evolusi bertahap, bukan membangun ulang dari nol             | Diterima                    |
| [0002](0002-satu-repositori-modular-monolith.md)   | Satu repositori dan satu aplikasi modular                    | Diterima                    |
| [0003](0003-tetap-nextjs-react-typescript.md)      | Tetap memakai Next.js, React, dan TypeScript                 | Diterima                    |
| [0004](0004-tetap-mysql-retensi-bertingkat.md)     | Tetap MySQL dengan retensi data bertingkat                   | Diusulkan — belum disetujui |
| [0005](0005-hosting-portabel-disetujui-pemilik.md) | Aplikasi portabel dan hosting yang disetujui pemilik layanan | Diusulkan — belum disetujui |
| [0006](0006-kontrak-perangkat-berversi.md)         | Kontrak perangkat berversi: v1 dibekukan, v2 ditambahkan     | Diusulkan — belum disetujui |
| [0007](0007-tetap-https.md)                        | Tetap HTTPS; MQTT hanya bila terbukti perlu                  | Diusulkan — belum disetujui |
| [0008](0008-backup-berbeda-dari-arsip.md)          | Backup berbeda dari arsip                                    | Diusulkan — belum disetujui |
| [0009](0009-akses-per-lokasi.md)                   | Akses data dibatasi per lokasi                               | Diusulkan — belum disetujui |
| [0010](0010-alarm-operasional-dan-sistem.md)       | Alarm operasional dipisah dari alarm sistem                  | Diusulkan — belum disetujui |
| [0011](0011-struktur-modul-dan-aturan-lapisan.md)  | Struktur modul dan aturan lapisan                            | Diterima                    |

Catatan keputusan sebelum Oktober 2026 tersimpan sebagai riwayat di
[decision-log.md](../decision-log.md).
