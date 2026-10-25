# Aturan Kerja untuk Kontributor dan Alat Bantu

Berkas ini merangkum aturan teknis yang wajib diikuti siapa pun yang mengubah
repositori ini, termasuk alat bantu pemrograman otomatis. Penjelasan lengkap ada
di [CONTRIBUTING.md](CONTRIBUTING.md) dan [docs/architecture.md](docs/architecture.md).

## Ringkasan proyek

FTM (Fuel Tank Management) memantau isi tangki solar genset di gedung STO.
Perangkat ESP8266 mengirim data ke `POST /api/ingest`; aplikasi Next.js +
TypeScript + MySQL menyimpan dan menampilkannya. Aplikasi ini adalah pilot
operasional yang sedang dipakai.

## Perintah

```text
pnpm install --frozen-lockfile
pnpm dev                 # pengembangan, http://localhost:3000
pnpm format              # rapikan format (Prettier)
pnpm check               # format:check + typecheck + lint + test + build (wajib lulus)
pnpm typecheck | pnpm lint | pnpm test | pnpm build
pnpm test:integration    # butuh FTM_TEST_MYSQL_URL ke MySQL lokal (localhost saja)
pnpm audit --prod
git diff --check
docker compose -f deploy/local/compose.yaml up -d   # MySQL + email lokal
```

Node.js 22 dan pnpm 9.15.3. Dokumentasi Next.js versi yang terpasang ada di
`node_modules/next/dist/docs/`; rujuk dokumen itu, bukan ingatan tentang versi lain.

## Struktur

- `src/app/` — halaman, route handler (`api/**/route.ts`), server action. Dibuat tipis.
- `src/features/<modul>/` — `monitoring`, `auth`, `helpdesk`. Bentuk folder (ADR 0011):
  `components/`, `domain/` (logika murni), `server/` (layanan), `server/repositories/`
  (SQL), `types/`, `tests/`. `monitoring` masih memakai `lib/` sampai dipindah.
- `src/components/` — kerangka tampilan bersama.
- `database/migrations/` — migrasi MySQL berurutan; `database/seeds/` — data fiktif.
- `firmware/templates/` — templat firmware v1 (dibekukan).
- `scripts/` — migrasi, simulator, alat operasional.
- `docs/` — dokumentasi; keputusan di `docs/decisions/`.

## Aturan lapisan

```text
src/app → layanan modul → repositori (SQL) → koneksi database
```

- Halaman, route handler, dan server action tidak mengimpor repositori, koneksi
  database, atau `mysql2`. Aturan ini dicek ESLint; data diambil lewat layanan di
  `server/` modul.
- Rumus operasional (volume, status, sisa jam genset, konsumsi) hanya di satu
  tempat, tanpa I/O, dan diberi tes.
- Layanan di `server/` hanya memakai repositori modulnya sendiri (jalur relatif pendek);
  repositori modul lain diakses lewat layanan modul itu. Aturan ini dicek ESLint.
- Client component tidak mengimpor kode khusus server.
- Angka dan tanggal yang dilihat pengguna ditulis lewat `src/lib/format.ts`; jangan membuat
  `Intl.NumberFormat` atau format tanggal baru di halaman.
- Route handler membalas JSON lewat `src/lib/http/json-response.ts` (`jsonOk`, `jsonError`,
  `jsonTooManyRequests`, `jsonCaughtError`) agar bentuk `{ ok, data | error }` seragam.
- Modul yang mengakses database, email, berkas, jaringan luar, rahasia, atau data permintaan
  (cookie/header) diawali `import "server-only";`. Build gagal bila modul seperti ini
  terimpor ke komponen browser.
- Pengaturan (variabel lingkungan) dibaca lewat `serverEnv` atau `publicEnv` di
  `src/lib/config/`, bukan `process.env` langsung. Variabel baru didaftarkan di sana
  beserta penjelasan singkat dan contoh nilainya di `.env.example`.
- Kode memakai bahasa Inggris; teks yang dilihat pengguna memakai bahasa Indonesia.

## Aturan perilaku

- **Tanpa fitur baru dan tanpa perubahan perilaku** kecuali tugasnya menyebut
  perubahan itu secara eksplisit. Perapian kode harus mempertahankan angka,
  status, pesan, respons API, email, pesan Telegram, dan tampilan.
- **Kontrak perangkat v1 dibekukan**: path `/api/ingest`, header (`X-Device-Id`,
  `X-Api-Key`, `X-Device-Key`, `X-Provisioning-Key`), cara membaca isi kiriman,
  hasil validasi, kode status, isi balasan, dan keluaran paket firmware.
- Tes ditulis sebelum perapian. Tes tidak boleh dihapus, dilewati, atau dilemahkan
  agar lulus. Tes yang mengunci perilaku keliru diberi nama yang menyebut hal itu.
- Ketidakkonsistenan yang ditemukan dicatat, bukan diperbaiki diam-diam.
- Migrasi 001–009 tidak boleh diubah; perubahan skema memakai migrasi baru.

## Git

- Branch dari `origin/dev` terbaru; pull request ke `dev`; squash merge.
- `main` adalah produksi dan hanya menerima rilis yang disetujui pemilik
  repositori. Tidak ada push langsung ke `main` atau `dev`.
- Format commit dan judul pull request: `type(scope): deskripsi` (deskripsi bahasa
  Indonesia, huruf kecil, tanpa titik, judul maks. 100 karakter).
- Tidak ada _force push_, penulisan ulang riwayat, atau melewati pemeriksaan
  (`--no-verify`).
- Jangan mengubah, menghapus, atau menimpa branch, worktree, atau perubahan yang
  bukan milik sendiri.

## Hal yang dilarang

- Membuka, menyalin, atau menampilkan isi `.env.local` atau rahasia apa pun.
- Menjalankan migrasi, seed, skrip, atau aplikasi terhadap database produksi.
- Mengirim permintaan ke alamat produksi, men-_deploy_, atau mengubah pengaturan
  hosting, database, atau GitHub.
- Mengirim email atau pesan Telegram ke orang sungguhan dari lingkungan
  pengembangan.
- Memasukkan rahasia, data pribadi, kode lokasi nyata, koordinat, path laptop,
  atau catatan kerja lokal ke repositori.

## Aturan bawaan Next.js

Blok di bawah ini adalah aturan resmi Next.js untuk alat bantu pemrograman. Blok itu
dibuat dan diperbarui otomatis oleh `next dev` (opsi `agentRules`, aktif sejak Next.js
16.3) agar alat bantu membaca dokumentasi yang cocok dengan versi Next.js terpasang.
Jangan mengubah isi di antara penanda `BEGIN`/`END` secara manual.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
