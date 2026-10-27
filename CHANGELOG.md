# Changelog

Semua perubahan penting pada FTM dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan
penomoran versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).
Bagian **Belum dirilis** berisi perubahan yang sudah ada di `dev` tetapi belum
dirilis ke `main`.

## [Belum dirilis]

### Ditambahkan

- Kit UI dasar di `src/components/ui/`: `Card` (24 kartu), `StatusPill` (5 lencana status),
  `FormErrorMessage` dan `ActionMessage` (10 kotak pesan), serta kelas tombol utama dan
  sekunder (8 tombol). HTML yang dihasilkan sama persis; tampilan tidak berubah.
- Dokumen `docs/cara-kerja-ftm.md`: cara kerja FTM, bagian aplikasi, pagar pengaman
  otomatis, dan alur rilis dalam bahasa sehari-hari untuk pembaca yang tidak menulis kode.
- Alur kerja GitHub untuk branch `dev`: CI berjalan untuk `dev` dan `main`,
  template pull request, formulir issue (bug, fitur, tugas teknis), dan
  CODEOWNERS (#18).
- Stack pengembangan lokal `deploy/local/compose.yaml` (MySQL 8.4.8 dan penangkap
  email Mailpit) (#19).
- Indeks dokumentasi `docs/README.md`, catatan keputusan arsitektur ADR 0001–0010,
  dan dokumen arsitektur yang sesuai kode per Oktober 2026 (#20).
- `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `CHANGELOG.md`, dan `AGENTS.md` (#21).
- ADR 0011: struktur modul (`monitoring`, `devices`, `auth`, `helpdesk`, `admin`),
  bentuk folder per modul, dan aturan lapisan.
- Katalog pengaturan `src/lib/config/server-env.ts` dan `public-env.ts`: semua 53
  variabel lingkungan yang dibaca aplikasi terdaftar di satu tempat dengan penjelasan
  singkat. Kode lain membaca lewat katalog ini; ESLint menolak `process.env` di luar
  katalog dan tes. Nilai dan cara pembacaan tidak berubah.
- Aturan ESLint `no-restricted-imports` untuk `src/app`: impor repositori, koneksi
  database, atau `mysql2` ditolak saat lint dan di CI (ADR 0011).
- Prettier sebagai pemformat kode (`pnpm format`, `pnpm format:check`) dan `.nvmrc`
  untuk Node.js 22 (#22).
- commitlint untuk format pesan commit dan judul pull request, hook git lefthook
  (format dan lint sebelum commit, commitlint, typecheck dan tes sebelum push),
  Dependabot mingguan untuk npm dan bulanan untuk GitHub Actions ke branch `dev`,
  serta laporan `pnpm audit --prod` di CI (#24).
- Tes karakterisasi yang mengunci perilaku sekarang sebelum kode dirapikan: kontrak
  `/api/ingest` v1, aktivasi kiriman pertama, normalisasi kiriman, ambang status di
  tiga tempat, volume, konsumsi, bucket 5 menit, paket firmware v1, serta hash sesi,
  OTP, dan CSRF. Konfigurasi Vitest kini mengenali alias `@/` dan memisahkan tes
  integrasi (#26).
- Tes integrasi dengan MySQL sungguhan (`pnpm test:integration`) untuk transaksi
  penyimpanan pembacaan, alur pengajuan sampai aktivasi kiriman pertama (termasuk
  dua kiriman bersamaan), dan cakupan reset pembacaan; dijalankan di CI dengan
  MySQL 8.4.8.

### Diubah

- Halaman detail tangki admin `/dashboard/tanks/[id]` (±1.500 baris) dipecah ke
  `tanks/[tankId]/_components/` (data detail, tabel ambang sisa jam, visual tangki, panel,
  tabel pembacaan, format). Teks komponen tidak berubah; tampilan sama.
- Halaman manajemen pengguna admin (±1.200 baris) dipecah: filter, lencana, tombol aksi, daftar
  pengajuan akses, dan pembacaan filter dari URL pindah ke `admin/users/_components/`. Halaman kini
  ±530 baris. Teks komponen tidak berubah; tampilan sama.
- Repositori akun (`mysql-auth-repository.ts`, ±1.700 baris) dipecah menurut tanggung jawab
  ke `auth/server/repositories/accounts/` (pengguna, sesi, administrasi pengguna, pengajuan akses,
  token, Telegram, audit). Teks deklarasi dan SQL tidak berubah; berkas lama menjadi pintu
  ekspor dengan daftar ekspor yang sama.
- Modul baru `admin` (`src/features/admin/`) berisi layanan dan repositori perawatan data
  beserta tesnya. Isi berkas tidak berubah selain alamat impor. Semua modul kini memakai
  bentuk folder ADR 0011.
- Modul baru `devices` (`src/features/devices/`) berisi pengajuan perangkat, pembuatan perangkat
  dari kiriman pertama, kunci perangkat, paket firmware, email paket, notifikasi admin, repositori
  pengajuan, dan tesnya. Isi berkas tidak berubah selain alamat impor. Penerimaan data kini
  mengaktifkan perangkat lewat layanan `devices`. Impor antar-modul memakai alias `@/features/...`.
- Modul `monitoring` memakai bentuk folder ADR 0011: rumus dan view model di `domain/`,
  layanan di `server/`, kueri SQL di `server/repositories/`. Koneksi database bersama pindah
  ke `src/lib/database/mysql-connection.ts`. Isi berkas tidak berubah selain alamat impor.
  ESLint kini menolak layanan dan `domain/` yang memakai koneksi database langsung.
- Repositori pengajuan perangkat dipecah ke `server/repositories/device-requests/`
  menurut pengajuan, peninjauan, paket, dan aktivasi. Pintu impor lama serta semua
  fungsi dan tipe publik tetap; SQL, transaksi, penguncian baris, dan firmware tidak berubah.
- Warna status (lencana dan titik penanda) diambil dari satu peta,
  `src/components/ui/status-tone.ts`, di 16 berkas. Kelas CSS hasil build identik; tampilan
  tidak berubah.
- Format angka dan tanggal-jam Jakarta disatukan di `src/lib/format.ts` (`formatNumber`,
  `formatDateTimeJakarta`) dan dipakai 15 berkas: halaman, komponen dashboard, email paket
  firmware, dan pesan Telegram. Teks yang tampil tidak berubah.
- Route handler membalas JSON lewat pembantu `src/lib/http/json-response.ts` (`jsonOk`,
  `jsonError`, `jsonTooManyRequests`, `jsonCaughtError`) di 21 route. Status, isi JSON, dan
  header tidak berubah. ADR 0011 dikoreksi karena pembantu ini sebelumnya dinyatakan batal.
- Modul `auth` memakai bentuk folder ADR 0011: validasi dan aturan alamat tujuan di
  `domain/`, layanan di `server/`, kueri SQL di `server/repositories/`, tipe di
  `types/auth.ts`. Isi berkas tidak berubah selain alamat impor. ESLint kini menolak I/O
  di `domain/` dan impor `server/repositories/` dari `src/app`.
- Modul `helpdesk` memakai bentuk folder ADR 0011: layanan, notifikasi, dan relay
  Telegram di `server/`, kueri SQL di `server/repositories/mysql-helpdesk-repository.ts`,
  tipe di `types/helpdesk.ts`. Isi berkas tidak berubah selain alamat impor. ESLint kini
  menolak layanan yang memakai repositori atau koneksi database modul lain.
- ADR 0011 diberi bagian **Pembaruan**: aturan lapisan `src/app` tercapai dan dicek
  otomatis, penanda `server-only` dan katalog pengaturan dibuat, serta pembantu balasan
  HTTP dibatalkan beserta alasannya.
- Lima lokasi contoh pada penyimpanan memori memakai nama, kode tampilan, dan
  area fiktif tanpa koordinat; ID, hubungan perangkat/tangki, serta angka
  operasional tetap sama.
- Lima pemanggil alur pengajuan perangkat kini memakai layanan modul untuk
  pengajuan, tinjauan, dan unduhan paket. Fungsi repositori, transaksi, pemeriksaan
  akses, email, dan tampilan tetap; tes integrasi pemasangan juga melewati layanan.
- Halaman audit, manajemen pengguna, dan aksi profil mengambil data lewat pintu
  layanan `src/features/auth/server/` (ADR 0011), bukan langsung dari repositori MySQL.
- Route bantuan web `/api/helpdesk/session` dan `/api/helpdesk/messages` memakai
  layanan `src/features/helpdesk/server/`; isi balasan, batas permintaan, dan notifikasi tetap.
- Aksi perawatan data di dashboard dan halaman pengajuan perangkat (reset pembacaan,
  pembersihan data uji) memakai layanan `src/features/monitoring/server/maintenance-service.ts`;
  konfirmasi, cakupan penghapusan, dan pesan tetap. Tidak ada lagi impor repositori di `src/app`.
- Panduan pemeriksaan lokal disesuaikan dengan Node.js 22, pnpm 9.15.3, aturan
  login, kesiapan layanan, simulator, dan tes MySQL; status audit keamanan dibatasi
  pada branch yang diperiksa dan diberi tanggal (#35).
- Data contoh MySQL memakai kode dan nama lokasi fiktif dengan koordinat kosong;
  identitas perangkat, hubungan data, dan angka operasional tetap sama.
- `.env.example` mencantumkan semua variabel yang dibaca kode; contoh alamat smoke
  test diarahkan ke `localhost` (#19).
- README, CONTRIBUTING, dan SECURITY ditulis ulang: status bertanggal, cara
  menjalankan lokal, alur branch `dev` → `main`, format commit, dan pelaporan
  kerentanan secara privat.
- Dokumen bulan Juli ditandai riwayat atau perlu diperiksa ulang tanpa menghapus
  isinya (#20).

### Dihapus

- Kode yang terbukti tidak dipakai dihapus (±300 baris): tombol keluar `LogoutButton`
  (tombol keluar yang aktif ada di menu pengguna), dua formulir admin yang tidak lagi dirender
  sejak penyederhanaan halaman tinjauan perangkat (Juli 2026), serta 9 fungsi dan 3 tipe tanpa
  pemakai. Tampilan dan perilaku tidak berubah.

### Keamanan

- Penanda `server-only` (paket resmi React) di 38 modul khusus server: repositori,
  koneksi database, layanan, email, Telegram, sesi, CSRF, kunci perangkat, paket
  firmware, dan konfigurasi rahasia. Build gagal bila modul ini terimpor ke kode
  browser. Perilaku aplikasi tidak berubah.
- Next.js dinaikkan dari 16.2.9 ke 16.4.3 untuk menutup 5 kerentanan kritis dan 6
  tinggi (antara lain eksekusi kode jarak jauh di optimasi gambar dan DoS pada server
  action). Perubahan perilaku yang terlihat: halaman alias `/dashboard/ringkasan` dan
  `/dashboard/locations` kini membalas pengalihan HTTP 307/308, bukan halaman 200 yang
  mengalihkan di browser; halaman tujuannya tetap sama. `AGENTS.md` memuat blok
  aturan bawaan Next.js.
- mysql2 dinaikkan dari 3.22.5 ke 3.23.4 untuk menutup kerentanan dekompresi paket
  tanpa batas; tidak ada perubahan data atau perilaku yang terlihat.
- nodemailer dinaikkan dari 9.0.3 ke 10.1.7 untuk menutup 2 kerentanan tinggi dan 9
  sedang; isi keempat jenis email (OTP admin, reset kata sandi, verifikasi email,
  paket firmware) tetap sama. `@types/nodemailer` dihapus karena tipe data kini ada
  di paket nodemailer.
- Versi aman dipaksa lewat `pnpm.overrides` untuk paket turunan Next.js:
  `browserslist` 4.28.9, `baseline-browser-mapping` 2.11.0, dan `source-map-js` 1.2.2.
  `pnpm audit --prod` kini tidak menemukan kerentanan.
- Job CI audit dependensi kini wajib lulus: kerentanan tinggi atau kritis pada
  dependensi produksi menggagalkan pull request.

## [0.1.0] - 2026-08-02

Versi yang berjalan di pilot sejak 2 Agustus 2026 (commit `4bda023`). Isinya
mencakup penerimaan data perangkat (`/api/ingest`) dengan kunci per perangkat,
snapshot terbaru dan ringkasan 5 menit, dashboard dengan peta dan filter
Regional/Wilayah/Area/STO, detail tangki dengan grafik dan ekspor CSV, pengajuan
perangkat sampai paket firmware dan aktivasi kiriman pertama, akun dengan
verifikasi email, persetujuan admin, OTP admin, integrasi Telegram, dan helpdesk.

[Belum dirilis]: https://github.com/Zendin110206/solar-tank-monitoring-system/compare/4bda023...dev
[0.1.0]: https://github.com/Zendin110206/solar-tank-monitoring-system/tree/4bda023
