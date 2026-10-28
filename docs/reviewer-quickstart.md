# Panduan Pemeriksaan Lokal FTM

> **Diperiksa 28 Oktober 2026** terhadap kode pada branch `dev`. Panduan ini untuk
> memeriksa aplikasi di laptop dengan data fiktif. Perubahan pada `dev` belum
> berarti sudah dirilis ke `main` (versi yang dipakai pilot).

## 1. Siapkan folder pemeriksaan

Gunakan Git, Node.js **22**, pnpm **9.15.3**, dan Docker Desktop yang sedang
berjalan. Versi Node tercatat di `.nvmrc`, sedangkan versi pnpm di `package.json`.

```powershell
git clone --branch dev https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
corepack enable
node --version
pnpm --version
pnpm install --frozen-lockfile
```

`--frozen-lockfile` mempertahankan versi dependensi (pustaka pendukung) yang sudah
dicatat. Untuk mengubah kode, buat branch kerja dari `origin/dev` sesuai
[panduan kontribusi](../CONTRIBUTING.md#alur-kerja-harian).

Gunakan folder baru yang tidak memuat konfigurasi produksi. Jangan menyalin
konfigurasi dari aplikasi pilot atau folder kerja orang lain. Alamat aplikasi,
database, dan penangkap email harus mengarah ke laptop sendiri; token Telegram
tidak diperlukan untuk pemeriksaan lokal.

## 2. Jalankan dengan MySQL dan email lokal

Ikuti [Menjalankan secara lokal](../README.md#menjalankan-secara-lokal) di README.
Bagian itu memuat konfigurasi lokal, migrasi 001–009 (pembuatan struktur tabel),
data contoh, akun admin `admin@example.test`, dan cara menjalankan aplikasi.
Gunakan database lokal yang khusus disiapkan untuk pemeriksaan.

Sebelum menjalankan `pnpm db:setup:mysql` atau `pnpm auth:create-admin`, pastikan
host, port, dan nama database tujuannya sesuai. Contoh bawaan memakai
`127.0.0.1:3307/ftm_local`. Jika port itu sudah dipakai, sesuaikan port kontainer
dan konfigurasi aplikasi bersama-sama; jangan memakai database milik pekerjaan
lain.

| Alamat bawaan           | Kegunaan                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `http://localhost:3000` | Aplikasi lokal                                                                              |
| `http://127.0.0.1:8026` | Penangkap email Mailpit: OTP admin, verifikasi, reset kata sandi, dan tautan paket firmware |

Masuk melalui `/login` dengan akun lokal. OTP (kode sekali pakai) dibaca di
Mailpit. Pendaftaran pengguna baru tetap membutuhkan verifikasi email dan
persetujuan admin. Jangan memakai akun atau penerima email sungguhan.

Tanpa MySQL, mode `memory` hanya cukup untuk mencoba halaman publik dan
penerimaan data perangkat. Data monitoring di memori hilang saat proses dimulai
ulang; login dan dashboard tetap membutuhkan tabel akun di MySQL.

## 3. Periksa akses halaman

| Halaman                                                                                | Akses                                                                  |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`                      | Halaman publik; beberapa halaman mengalihkan pengguna yang sudah masuk |
| `/dashboard`                                                                           | Pengguna aktif dan admin                                               |
| `/dashboard/ringkas/tanks/<tankId>`                                                    | Pengguna aktif dan admin                                               |
| `/dashboard/detail`, `/dashboard/tanks/<tankId>`                                       | Admin                                                                  |
| `/dashboard/devices/request`                                                           | Pengguna aktif dan admin                                               |
| `/dashboard/admin/device-requests`, `/dashboard/admin/users`, `/dashboard/admin/audit` | Admin                                                                  |
| `/dashboard/profile`, `/dashboard/account/security`, `/dashboard/contact`              | Pengguna aktif dan admin                                               |

Pilih tangki melalui dashboard supaya `tankId` (identitas tangki) sesuai dengan
data lokal. Pengunjung yang belum masuk diarahkan ke login ketika membuka
dashboard. Pengguna biasa yang membuka halaman admin diarahkan ke
`/unauthorized`.

## 4. Bedakan aplikasi hidup dan kesiapan layanan

```powershell
curl.exe -i http://localhost:3000/api/health
curl.exe -i http://localhost:3000/api/ready
```

- `/api/health` terbuka untuk umum dan memeriksa bahwa aplikasi dapat menjawab.
  Hasilnya tidak membuktikan database tersambung.
- `/api/ready` memeriksa penyimpanan, struktur tabel, serta konfigurasi akun,
  email, Telegram, perangkat, paket firmware, dan backup. Periksa daftar `checks`
  pada respons untuk mengetahui bagian yang belum siap.
- Akses anonim ke `/api/ready` diizinkan bila aplikasi tidak berjalan dalam mode
  produksi dan `READINESS_CHECK_TOKEN` tidak diisi. Selain itu diperlukan akun
  admin atau token yang cocok; permintaan tanpa izin menerima HTTP `401`.
- Jika tidak ada kesalahan, `/api/ready` membalas HTTP `200`, dengan status `ready`
  atau `degraded`. Jika ada kesalahan, balasannya HTTP `503` dan status
  `not_ready`. Konfigurasi lokal yang belum lengkap dapat menghasilkan peringatan
  atau kesalahan; baca bagian pemeriksaannya.

Jangan mengisi token layanan sungguhan atau menganggap backup sudah teruji hanya
untuk memperoleh status `ready`. Keterbatasan backup dijelaskan di
[database-backup.md](database-backup.md).

## 5. Kirim satu pembacaan lokal dan periksa hasilnya

Setelah data contoh MySQL tersedia dan aplikasi berjalan, buka terminal lain di
folder yang sama:

```powershell
pnpm simulate:device --base-url http://localhost:3000 --device demo-tph-01 --key demo-tph-key --start-percent 73 --once
```

Identitas dan kunci tersebut adalah contoh lokal yang sudah disediakan. Simulator
(pengirim data pengganti perangkat) mengirim satu kali lalu berhenti. Pastikan
alamatnya tetap lokal. Periksa keberhasilan kiriman, kemudian buka tangki yang
sesuai di dashboard untuk melihat pembacaan terbaru dan riwayatnya.

Jangan menyimpulkan bahwa nilai liter selalu sama dengan contoh perhitungan
simulator: server mencocokkan konfigurasi kiriman dengan registry (daftar tangki
dan perangkat) sebelum menentukan nilai yang disimpan.

Untuk memeriksa API tangki, buka alamat berikut **di browser yang sudah masuk**,
dengan mengganti `<tankId>` memakai identitas tangki lokal:

```text
http://localhost:3000/api/tanks/<tankId>
http://localhost:3000/api/tanks/<tankId>/readings?range=24h
```

Keduanya memerlukan sesi login. `curl.exe` tanpa cookie login menerima HTTP `401`,
bukan data tangki. Tangki yang tidak ditemukan menerima HTTP `404`; API riwayat
juga membalas `404` bila belum ada pembacaan. Parameter `range` saat ini
dicantumkan kembali pada respons riwayat, tetapi belum menyaring hasil yang
diambil. Perilaku tersebut perlu diperbaiki terpisah; pemeriksaan ini
mempertahankan perilaku sekarang.

## 6. Jalankan pemeriksaan otomatis

```powershell
pnpm check
pnpm audit --prod
git diff --check
```

`pnpm check` menjalankan pemeriksaan format, tipe TypeScript, pola kode (lint),
tes unit dan karakterisasi, lalu build (perakitan aplikasi). Tes karakterisasi
mengunci perilaku sekarang, termasuk yang diketahui perlu diperbaiki.
Audit dependensi diperiksa terpisah; CI (pemeriksaan otomatis GitHub) menolak
kerentanan tingkat tinggi atau kritis pada dependensi produksi.

Tes integrasi MySQL dijalankan terpisah dari `pnpm check`. Ikuti
[bagian Tes](../CONTRIBUTING.md#tes) untuk mengisi `FTM_TEST_MYSQL_URL` dengan
alamat MySQL lokal, lalu jalankan:

```powershell
pnpm test:integration
```

Setiap berkas tes membuat database sementara `ftm_it_*`, menerapkan migrasi,
lalu menghapus database buatannya. Akun MySQL pengujian harus dapat membuat dan
menghapus database tersebut. Pemeriksaan ini mencakup penyimpanan pembacaan,
pengajuan sampai aktivasi perangkat, dan cakupan reset pembacaan.

## 7. Bila pemeriksaan gagal

- Kiriman simulator gagal: periksa alamat/port aplikasi, data perangkat lokal,
  serta kunci contoh yang dipakai. Lihat pilihan melalui
  `pnpm simulate:device --help`; jangan melonggarkan pemeriksaan kunci.
- Dashboard tidak terbuka: pastikan MySQL dan migrasi akun sudah siap, lalu masuk
  dengan akun lokal yang aktif dan peran yang sesuai.
- `/api/ready` membalas `401`: periksa aturan akses di atas. Jika `503`, baca
  `checks` sebelum menyimpulkan semua layanan gagal.
- Tes integrasi menolak koneksi: pastikan targetnya MySQL lokal dan akun pengujian
  memiliki izin membuat database sementara.
- Pemeriksaan kode gagal: perbaiki penyebabnya sebelum push. Jangan melewati
  pemeriksaan atau mengurangi ketatnya tes.

Skrip `pilot:registry`, `pilot:smoke`, dan `db:backup:mysql` merupakan alat
operasional yang dijelaskan di [README](../README.md#perintah), bukan prasyarat
untuk pemeriksaan lokal ini. Langkah registrasi pilot yang dahulu dimuat di sini
tetap tersedia sebagai [panduan lapangan Juli 2026](field-pilot-5-sto-guide.md);
dokumen itu berstatus riwayat dan perlu diperiksa ulang sebelum dipakai.
Pemeriksaan lokal tidak membuktikan kalibrasi sensor,
keamanan instalasi fisik, pemulihan backup, atau kesiapan produksi penuh.
