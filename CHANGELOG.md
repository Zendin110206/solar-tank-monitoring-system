# Changelog

Semua perubahan penting pada FTM dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan
penomoran versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).
Bagian **Belum dirilis** berisi perubahan yang sudah ada di `dev` tetapi belum
dirilis ke `main`.

## [Belum dirilis]

### Ditambahkan

- Alur kerja GitHub untuk branch `dev`: CI berjalan untuk `dev` dan `main`,
  template pull request, formulir issue (bug, fitur, tugas teknis), dan
  CODEOWNERS (#18).
- Stack pengembangan lokal `deploy/local/compose.yaml` (MySQL 8.4.8 dan penangkap
  email Mailpit) (#19).
- Indeks dokumentasi `docs/README.md`, catatan keputusan arsitektur ADR 0001–0010,
  dan dokumen arsitektur yang sesuai kode per Oktober 2026 (#20).
- `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `CHANGELOG.md`, dan `AGENTS.md` (#21).
- Prettier sebagai pemformat kode (`pnpm format`, `pnpm format:check`) dan `.nvmrc`
  untuk Node.js 22.

### Diubah

- `.env.example` mencantumkan semua variabel yang dibaca kode; contoh alamat smoke
  test diarahkan ke `localhost` (#19).
- README, CONTRIBUTING, dan SECURITY ditulis ulang: status bertanggal, cara
  menjalankan lokal, alur branch `dev` → `main`, format commit, dan pelaporan
  kerentanan secara privat.
- Dokumen bulan Juli ditandai riwayat atau perlu diperiksa ulang tanpa menghapus
  isinya (#20).

## [0.1.0] - 2026-08-02

Versi yang berjalan di pilot sejak 2 Agustus 2026 (commit `4bda023`). Isinya
mencakup penerimaan data perangkat (`/api/ingest`) dengan kunci per perangkat,
snapshot terbaru dan ringkasan 5 menit, dashboard dengan peta dan filter
Regional/Wilayah/Area/STO, detail tangki dengan grafik dan ekspor CSV, pengajuan
perangkat sampai paket firmware dan aktivasi kiriman pertama, akun dengan
verifikasi email, persetujuan admin, OTP admin, integrasi Telegram, dan helpdesk.

[Belum dirilis]: https://github.com/Zendin110206/solar-tank-monitoring-system/compare/4bda023...dev
[0.1.0]: https://github.com/Zendin110206/solar-tank-monitoring-system/tree/4bda023
