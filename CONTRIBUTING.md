# Panduan Kontribusi FTM

Panduan ini menjaga agar setiap perubahan jelas, aman bagi pilot yang sedang
berjalan, mudah ditinjau, dan tidak menimpa pekerjaan orang lain.

## Prinsip dasar

1. **`main` adalah produksi.** Setiap commit di `main` langsung terpasang ke
   aplikasi pilot yang dipakai tim lapangan. `main` hanya menerima rilis dari
   `dev` yang sudah disetujui pemilik repositori.
2. **Semua pekerjaan lewat pull request ke `dev`.** Tidak ada commit langsung ke
   `dev` maupun `main`.
3. **Satu perubahan, satu tujuan.** Jangan mencampur perapian format, penggantian
   nama, dan perubahan logika dalam satu commit.
4. **Perilaku tidak berubah tanpa disengaja.** Perapian kode (_refactor_) dan
   pembaruan dependensi harus membuktikan bahwa angka, status, pesan, respons API,
   dan tampilan tetap sama.
5. **Kontrak perangkat v1 dibekukan.** Alamat `/api/ingest`, header, isi kiriman,
   kode status, isi balasan, dan paket firmware v1 tidak boleh berubah. Perangkat
   yang terpasang tidak bisa diperbarui dari jauh.
6. **Seluruh diff dibaca sebelum commit.**
7. **Riwayat yang sudah dibagikan tidak ditulis ulang.** Tidak ada _force push_.

## Menyiapkan repositori

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

Untuk menjalankan aplikasi dengan database lokal, ikuti bagian
[Menjalankan secara lokal](README.md#menjalankan-secara-lokal) di README. Laptop
pengembang **tidak pernah** diarahkan ke database atau alamat produksi.

## Alur kerja harian

1. Ambil pembaruan terbaru: `git fetch origin`.
2. Buat branch dari `dev` terbaru:

   ```powershell
   git switch -c docs/contoh-perubahan origin/dev
   ```

   Bila beberapa orang atau alat bekerja bersamaan di satu laptop, pakai
   `git worktree` (folder kerja terpisah untuk setiap branch) supaya perubahan
   tidak saling menimpa:

   ```powershell
   git worktree add ..\ftm-contoh -b docs/contoh-perubahan origin/dev
   ```

3. Kerjakan perubahan dalam commit kecil yang jelas.
4. Sebelum push, ambil `dev` terbaru dan susun ulang branch di atasnya:

   ```powershell
   git fetch origin
   git rebase origin/dev
   ```

5. Jalankan [pemeriksaan sebelum push](#pemeriksaan-sebelum-push).
6. Push branch, lalu buka pull request ke `dev`.
7. Setelah pemeriksaan otomatis lulus dan peninjauan selesai, pull request
   digabung dengan **squash merge** (semua commit digabung menjadi satu, memakai
   judul pull request), lalu branch dihapus.

## Nama branch

Huruf kecil dan tanda hubung, diawali jenis perubahan:

```text
feat/pengajuan-perangkat
fix/scroll-tinjauan-mobile
docs/panduan-lokal
test/kontrak-ingest
refactor/modul-monitoring
chore/stack-lokal
ci/audit-dependensi
```

## Format commit

```text
type(scope): deskripsi
```

- `type` dan `scope` memakai istilah Inggris, huruf kecil. `scope` memakai
  tanda hubung bila lebih dari satu kata.
- Deskripsi memakai bahasa Indonesia yang ringkas dan wajar, huruf kecil, tanpa
  titik di akhir.
- Baris judul paling panjang 100 karakter; baris badan juga paling panjang
  100 karakter.
- Aturan ini diperiksa otomatis oleh commitlint (`.commitlintrc.json`).
- Badan commit (opsional) menjelaskan **mengapa** perubahan dibuat.

| Type       | Dipakai untuk                         |
| ---------- | ------------------------------------- |
| `feat`     | Kemampuan baru bagi pengguna          |
| `fix`      | Perbaikan perilaku yang salah         |
| `perf`     | Peningkatan kinerja                   |
| `refactor` | Perapian kode tanpa mengubah perilaku |
| `test`     | Tes                                   |
| `docs`     | Dokumentasi                           |
| `style`    | Format kode tanpa perubahan arti      |
| `build`    | Proses build dan dependensi           |
| `ci`       | Pemeriksaan otomatis GitHub           |
| `chore`    | Pemeliharaan lain (konfigurasi, alat) |
| `revert`   | Membatalkan commit sebelumnya         |

Scope yang dipakai: `ingest`, `monitoring`, `devices`, `firmware`, `auth`,
`helpdesk`, `admin`, `ui`, `db`, `deps`, `config`, `ci`, `docs`, `repo`.

Contoh:

```text
docs(repo): jelaskan cara menjalankan aplikasi secara lokal
test(ingest): kunci perilaku respons untuk kunci perangkat yang salah
refactor(monitoring): pindahkan kueri riwayat ke layanan modul
fix(ui): perbaiki scroll tinjauan perangkat di layar kecil
```

Hindari pesan seperti `update`, `revisi`, `coba`, atau `fix lagi`.

## Pemeriksaan sebelum push

```powershell
pnpm format         # rapikan format dengan Prettier
pnpm check          # format, tipe TypeScript, lint, tes, build
pnpm audit --prod   # kerentanan dependensi
git diff --check    # spasi berlebih dan konflik yang tertinggal
git status
```

`pnpm check` juga dijalankan GitHub Actions untuk setiap pull request ke `dev`
dan `main`, dan wajib lulus sebelum digabung. GitHub Actions juga memeriksa
format judul pull request dan menjalankan `pnpm audit --prod`; kerentanan tingkat
tinggi atau kritis pada dependensi produksi membuat pull request gagal.

### Tes

- `pnpm test`: tes unit dan tes karakterisasi (tes yang mengunci perilaku sekarang,
  termasuk perilaku yang tercatat perlu diperbaiki; namanya menyebut nomor temuannya).
- `pnpm test:integration`: tes dengan MySQL sungguhan. Setiap berkas tes membuat
  database sementara, menerapkan migrasi 001–009, lalu menghapusnya. Tes ini hanya
  mau berjalan ke MySQL di `localhost`/`127.0.0.1`:

  ```powershell
  docker compose -f deploy/local/compose.yaml up -d
  $env:FTM_TEST_MYSQL_URL="mysql://root:ftm-local-root@127.0.0.1:3307"
  pnpm test:integration
  ```

  CI menjalankannya otomatis di job `Integration tests (MySQL)`.

- Tes tidak boleh dihapus, dilewati, atau dilemahkan agar lulus. Bila perilaku
  memang sengaja diubah, ubah tes karakterisasinya di pull request yang sama dan
  jelaskan alasannya.

### Hook git otomatis

`pnpm install` memasang hook git lewat lefthook (alat yang menjalankan
pemeriksaan otomatis saat commit dan push):

- sebelum commit: format Prettier dan ESLint untuk berkas yang di-_stage_;
- saat menulis pesan commit: commitlint memeriksa format `type(scope): deskripsi`;
- sebelum push: `pnpm typecheck` dan `pnpm test`.

Bila hook belum terpasang, jalankan `pnpm exec lefthook install`. Jangan melewati
hook dengan `--no-verify`; perbaiki penyebab kegagalannya.

Pastikan tidak ada yang ikut ter-commit:

- file `.env` asli, kata sandi, token, kunci perangkat, atau sertifikat;
- data produksi, hasil backup, atau ekspor CSV;
- data pribadi, kode lokasi nyata, atau koordinat;
- catatan kerja lokal, path laptop, atau tangkapan layar berisi data internal.

## Pull request

Isi [template pull request](.github/pull_request_template.md) dengan bahasa
Indonesia yang wajar, yang bisa dipahami orang non-programmer:

- apa yang berubah dan mengapa;
- yang sengaja tidak diubah;
- **bukti paritas perilaku** untuk perapian kode dan pembaruan dependensi, yaitu
  tes, perbandingan respons API, dan screenshot halaman yang tersentuh pada lebar
  1440, 820, dan 390 px;
- cara verifikasi beserta hasilnya;
- dampak terhadap kontrak perangkat, database, keamanan, dan produksi.

Jelaskan istilah teknis singkat di tempat istilah itu muncul.

### Pull request ke `main`

`main` hanya menerima pull request rilis dari branch `dev` di repositori ini. Job CI
`Release source branch` menggagalkan pull request ke `main` yang berasal dari branch
lain atau dari fork.

Dependabot membuka pembaruan **keamanan** ke branch bawaan repositori (`main`), bukan ke
`dev`; pengaturan `target-branch: dev` di `.github/dependabot.yml` hanya berlaku untuk
pembaruan versi biasa. Pull request keamanan seperti itu jangan digabung. Buat ulang
perubahannya di branch baru dari `dev` (naikkan versi paket yang sama, perbarui
`pnpm-lock.yaml`, jalankan pemeriksaan), buka pull request ke `dev`, lalu tutup pull
request Dependabot tadi dengan tautan ke pull request pengganti.

## Dependensi baru

Sebelum menambah paket:

1. pastikan kebutuhannya belum bisa dipenuhi Next.js, React, atau paket yang ada;
2. periksa pemeliharaan, lisensi, dan riwayat keamanannya;
3. pastikan cocok dengan Node.js 22;
4. pakai pnpm dan perbarui `pnpm-lock.yaml`;
5. tulis alasannya di pull request.

Pembaruan dependensi dikerjakan per kelompok, satu pull request per kelompok,
dan setiap pembaruan versi besar membaca catatan perubahan paketnya terlebih dulu.

## Menjaga riwayat

- Jangan _force push_ ke branch yang sudah dibagikan.
- Jangan menghapus atau membuat ulang repositori, dan jangan menjalankan
  `git init` di dalam hasil clone.
- Jangan menghapus branch, worktree, atau pull request milik orang lain.
- Bila ada konflik, baca perubahan orang lain dulu dan bangun di atasnya. Jangan
  asal memilih versi sendiri.

## Arsitektur dan lapisan

FTM adalah satu aplikasi Next.js yang dibagi per modul di `src/features/`
(lihat [arsitektur](docs/architecture.md) dan
[ADR 0002](docs/decisions/0002-satu-repositori-modular-monolith.md)).

- Halaman, route handler, dan server action di `src/app` dibuat tipis dan
  memanggil layanan modul. ESLint menolak impor repositori, koneksi database, atau
  `mysql2` dari `src/app` (ADR 0011).
- Kueri SQL hanya ada di repositori modul. Layanan hanya memakai repositori modulnya
  sendiri; ESLint menolak repositori atau koneksi database modul lain.
- Rumus operasional (volume, status, sisa jam genset) ada di satu tempat, tanpa
  akses database, dan diberi tes.
- Komponen yang berjalan di browser tidak mengimpor kode khusus server.
- Modul yang mengakses database, email, berkas, jaringan luar, rahasia, atau data permintaan
  (cookie/header) diawali `import "server-only";`. Build gagal bila modul seperti ini
  terimpor ke komponen browser.
- Pengaturan (variabel lingkungan) dibaca lewat `serverEnv` atau `publicEnv` di
  `src/lib/config/`, bukan `process.env` langsung. Variabel baru didaftarkan di sana
  beserta penjelasan singkat dan contoh nilainya di `.env.example`.
- Keputusan struktur yang penting dicatat sebagai ADR di `docs/decisions/`.

## Database

- Migrasi yang sudah dipakai produksi (001–009) tidak boleh diubah. Perubahan
  skema dibuat sebagai migrasi bernomor baru yang bersifat menambah lebih dulu.
- Seed dan data contoh hanya berisi data fiktif.
- Skrip yang menulis ke database (`db:*`, `auth:create-admin`, `pilot:*`) hanya
  dijalankan setelah memastikan targetnya database lokal, kecuali oleh pemelihara
  yang berwenang dalam prosedur operasional.

## Dokumentasi

- Bahasa Indonesia yang wajar; istilah teknis dijelaskan di tempatnya.
- Setiap pernyataan tentang pilot menyebut tanggal.
- Rencana tidak ditulis seolah sudah tercapai.
- Perbarui `CHANGELOG.md` di setiap pull request yang mengubah sesuatu bagi
  pengguna, pengembang, atau operasi.
- Daftar dokumen ada di [docs/README.md](docs/README.md).

## Keamanan

Dugaan kerentanan dilaporkan secara privat sesuai [SECURITY.md](SECURITY.md),
bukan lewat issue biasa.
