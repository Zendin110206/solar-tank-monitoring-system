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
- Baris judul paling panjang 100 karakter.
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
pnpm check          # tipe TypeScript, lint, tes, build
pnpm audit --prod   # kerentanan dependensi
git diff --check    # spasi berlebih dan konflik yang tertinggal
git status
```

`pnpm check` juga dijalankan GitHub Actions untuk setiap pull request ke `dev`
dan `main`, dan wajib lulus sebelum digabung.

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
  memanggil layanan modul.
- Kueri SQL hanya ada di repositori modul.
- Rumus operasional (volume, status, sisa jam genset) ada di satu tempat, tanpa
  akses database, dan diberi tes.
- Komponen yang berjalan di browser tidak mengimpor kode khusus server.
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
