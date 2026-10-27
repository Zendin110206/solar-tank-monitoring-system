# ADR 0011 — Struktur modul dan aturan lapisan

- **Status:** Diterima
- **Tanggal:** 2026-10-25 (diterima; pembaruan 2026-10-25)
- **Pemilik keputusan:** pemelihara repositori
- **Terkait:** [ADR 0002](0002-satu-repositori-modular-monolith.md),
  [arsitektur](../architecture.md), [indeks keputusan](README.md)

## Konteks

- ADR 0002 menetapkan satu aplikasi Next.js yang dibagi per modul, tetapi belum
  menetapkan bentuk folder, pintu masuk modul, dan aturan yang bisa dicek otomatis.
- Per 25 Oktober 2026 ada tiga modul di `src/features/`: `auth`, `monitoring`, dan
  `helpdesk`. Hampir semua berkas logika ada di satu folder `lib/` per modul, sehingga
  logika murni, layanan, dan kueri SQL tercampur.
- 13 berkas di `src/app` (halaman, server action, route handler) memanggil fungsi
  repositori SQL secara langsung. Akibatnya, logika alur kerja tersebar di halaman dan
  sulit diuji tanpa database.
- Modul `monitoring` juga memuat pengajuan perangkat, paket firmware, dan aksi
  perawatan data. Ketiganya punya tanggung jawab berbeda dari pemantauan isi tangki.
- Pembacaan variabel lingkungan (16 berkas) dan pembuatan balasan JSON (23 route
  handler) ditulis di banyak tempat.

## Keputusan

### Daftar modul

| Modul        | Tanggung jawab                                                                                                                     | Kondisi per 25 Okt 2026                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `monitoring` | Pembacaan perangkat, volume, status, sisa jam genset, registry lokasi/tangki/perangkat, penerimaan data (`/api/ingest`), dashboard | Ada (masih memuat `devices` dan `admin`) |
| `devices`    | Pengajuan perangkat, persetujuan, kunci perangkat, paket firmware, token unduh, aktivasi kiriman pertama                           | Dipisah dari `monitoring`                |
| `auth`       | Akun, sesi, peran, OTP, CSRF, pembatas permintaan, audit, Telegram (binding dan perintah)                                          | Ada                                      |
| `helpdesk`   | Bantuan web dan relay ke Telegram                                                                                                  | Ada                                      |
| `admin`      | Aksi perawatan data (reset pembacaan, pembersihan data uji)                                                                        | Dipisah dari `monitoring`                |

Bagian bersama:

- `src/components/` untuk kerangka halaman bersama, dan `src/components/ui/` untuk
  kit UI (dibuat di paket kit UI);
- `src/lib/` untuk utilitas lintas modul, termasuk modul konfigurasi
  (`src/lib/config/`) dan pembantu balasan HTTP (`src/lib/http/`).

### Bentuk folder setiap modul

```text
src/features/<modul>/
├── components/      tampilan (server component dan client component)
├── domain/          logika murni tanpa I/O: rumus, aturan, validasi, view model
├── server/          layanan (use case): satu-satunya pintu data untuk src/app
│   └── repositories/   kueri SQL (mysql-*-repository.ts)
├── types/           tipe data yang dipakai bersama
└── tests/           tes unit dan karakterisasi; tes database *.integration.test.ts
```

Folder `lib/` yang ada sekarang dipindahkan ke bentuk ini **per modul**, satu pull
request per modul, dengan urutan `monitoring` → `devices` → `auth` → `helpdesk` →
`admin`. Pemindahan dan perubahan logika tidak pernah dicampur dalam satu commit.
Sampai pemindahan selesai, aturan lapisan di bawah dikenali dari nama berkas:
`mysql-*-repository.ts`, `*-repository.ts`, dan `mysql-connection.ts` adalah lapisan
repositori.

### Arah ketergantungan

```text
src/app (halaman, route handler, server action — tipis)
    → server/  layanan modul
        → server/repositories/  SQL
            → koneksi database
domain/ boleh dipakai siapa saja; domain/ tidak memakai apa pun selain domain/ dan types/
```

Aturannya:

1. `src/app` tidak mengimpor repositori atau koneksi database. Data diambil lewat
   layanan di `server/` modul yang bersangkutan.
2. Layanan boleh memanggil repositori modulnya sendiri dan layanan modul lain.
   Layanan tidak memanggil repositori modul lain.
3. `domain/` tidak melakukan I/O (database, jaringan, berkas, waktu sistem yang tidak
   dioper sebagai parameter).
4. Client component (`"use client"`) tidak mengimpor `server/` atau repositori.
5. Layanan boleh berupa pembungkus tipis repositori bila alurnya memang sederhana.
   Alur yang terdiri atas beberapa langkah (misalnya menyetujui pengajuan, mengirim
   email, lalu mencatat pengiriman) dipindah dari server action ke layanan di paket
   kerja berikutnya, setelah tesnya tersedia.

### Konvensi nama

- Nama berkas dan identifier memakai bahasa Inggris, kebab-case untuk berkas.
- Layanan: `<hal>-service.ts`. Repositori: `mysql-<hal>-repository.ts`.
- Teks yang dilihat pengguna memakai bahasa Indonesia.
- Fungsi layanan dinamai menurut kegiatan pengguna (misalnya
  `listDeviceRequestsForAdmin`), bukan menurut tabel.

### Penegakan

Aturan 1 ditegakkan dengan ESLint `no-restricted-imports` untuk berkas di `src/app`.
Aturan lain ditambahkan ke ESLint setiap kali sebuah modul selesai dipindahkan ke
bentuk folder di atas. Tidak dipakai kerangka arsitektur tambahan.

## Pilihan yang dipertimbangkan

### Pindahkan semua berkas sekaligus ke bentuk folder baru

- Kelebihan: struktur langsung rapi dalam satu langkah.
- Kekurangan: ratusan impor berubah sekaligus, diff sulit ditinjau, dan berisiko
  bertabrakan dengan pekerjaan lain.
- Hasil: tidak dipilih.

### Hanya aturan nama berkas, tanpa folder `server/`

- Kelebihan: tidak ada pemindahan berkas.
- Kekurangan: batas lapisan tetap sulit dibaca orang baru, dan aturan ESLint
  bergantung pada pola nama.
- Hasil: dipakai hanya sebagai masa transisi.

### Pintu layanan dulu, pemindahan folder per modul (dipilih)

- Kelebihan: perilaku tetap sama, setiap langkah kecil bisa dibuktikan, dan aturan
  langsung bisa ditegakkan.
- Kekurangan: selama transisi ada dua gaya (`lib/` dan bentuk folder baru).
- Hasil: dipilih.

## Konsekuensi

- `src/app` menjadi tipis dan bergantung pada layanan, sehingga alur kerja bisa diuji
  tanpa membuka halaman.
- Pemisahan `devices` dan `admin` dari `monitoring` membuat berkas besar seperti
  `mysql-device-request-repository.ts` lebih mudah dipecah.
- Selama transisi, pengembang perlu membaca ADR ini untuk tahu berkas mana yang
  termasuk lapisan apa.

## Risiko dan mitigasi

- Risiko: pemindahan berkas tanpa sengaja mengubah perilaku atau memasukkan kode
  server ke bundel browser.
  - Mitigasi: pemindahan murni (tanpa logika) per modul; tes unit, tes integrasi
    MySQL, pembandingan respons API ketat, dan screenshot sebelum/sesudah;
    perbandingan daftar rute hasil build.
- Risiko: layanan yang hanya meneruskan panggilan dianggap birokrasi.
  - Mitigasi: pembungkus tipis diperbolehkan dan dinyatakan jujur; manfaatnya adalah
    satu pintu yang bisa diuji dan dicek ESLint.

## Cara meninjau ulang

Ditinjau bila modul baru ditambahkan, bila ada aplikasi kedua yang memakai modul yang
sama (pemicu monorepo di ADR 0002), atau bila aturan ESLint terbukti terlalu sering
dikecualikan.

## Pembaruan

Bagian ini mencatat perkembangan setelah keputusan diterima. Isi keputusan di atas
tidak diubah.

### 25 Oktober 2026 — aturan 1 tercapai, pembantu balasan HTTP dibatalkan

- **Aturan 1 tercapai dan dicek otomatis.** Semua pemanggil langsung di `src/app`
  sudah memakai layanan modul (#36, #38, #39, #40). ESLint `no-restricted-imports`
  kini menolak impor repositori, koneksi database, dan `mysql2` dari `src/app` (#41).
- **Aturan 4 diperkuat.** 38 modul khusus server ditandai `import "server-only";`.
  Build gagal bila modul seperti itu terimpor ke kode browser (#42).
- **Modul konfigurasi dibuat.** `src/lib/config/server-env.ts` dan `public-env.ts`
  menjadi satu-satunya tempat membaca variabel lingkungan; ESLint menolak
  `process.env` di luar katalog dan tes (#43).
- **Pembantu balasan HTTP (`src/lib/http/`) tidak dibuat.** Semua 24 route handler
  sudah memakai `NextResponse.json` bawaan Next.js dengan bentuk `{ ok, data }` atau
  `{ ok: false, error }`. Membungkusnya dengan fungsi sendiri tidak menambah keamanan
  atau kejelasan, tetapi menambah satu lapisan yang harus dipelajari. Bentuk balasan
  dijaga lewat tes karakterisasi route dan pembandingan respons API. Keputusan ini
  ditinjau ulang bila bentuk balasan mulai berbeda-beda antar-route.

### 26 Oktober 2026 — koreksi: pembantu balasan HTTP dibuat

Pembatalan pada pembaruan sebelumnya keliru dan dikoreksi di sini. Pemeriksaan lebih
teliti menunjukkan pengulangan yang nyata di route handler: balasan 429 dengan
`Retry-After` ditulis ulang di 11 route, pola tangkap-error dengan pesan aman di 10
route, dan gaya `Response.json` bercampur dengan `NextResponse.json`. Rencana kerja
fondasi juga menetapkan satu pembantu balasan JSON.

`src/lib/http/json-response.ts` kini menyediakan `jsonOk`, `jsonError`,
`jsonTooManyRequests`, dan `jsonCaughtError`. Status, isi JSON, dan header tetap sama
persis. Route yang bentuk balasannya berbeda (`/api/ready`, `/api/dashboard/overview`,
dan unduhan paket firmware) tetap memakai `Response.json` / `NextResponse.json`
langsung.

### 26 Oktober 2026 — modul helpdesk dan auth dipindah

Modul `helpdesk` (#46) dan `auth` (#47) memakai bentuk folder di atas. Urutannya
diubah dari rencana (monitoring lebih dulu) karena modul `monitoring` menunggu
pemecahan repositori perangkat yang sedang berjalan. ESLint kini juga mengecek
aturan 2 (layanan tidak memakai repositori modul lain) dan aturan 3 (`domain/` tanpa
I/O).

### 27 Oktober 2026 — semua modul memakai bentuk folder

Modul `monitoring` (#53), `devices` (#54), dan `admin` menyusul helpdesk dan auth.
Tidak ada lagi folder `lib/` di dalam modul. Koneksi database bersama pindah ke
`src/lib/database/mysql-connection.ts` dan hanya boleh dipakai repositori. Impor
antar-modul memakai alias `@/features/<modul>/...`.

Pengecualian tertulis yang tersisa di `eslint.config.mjs` (layanan yang masih
menjalankan SQL sendiri): `auth/server/rate-limit.ts`,
`auth/server/admin-telegram-notifications.ts`, `devices/server/device-provisioning.ts`,
serta `monitoring/server/deployment-probes.ts` yang memang menguji koneksi database.

### 27 Oktober 2026 — pengecualian SQL di layanan dihapus

SQL yang masih dijalankan layanan dipindah ke repositori, sehingga semua layanan kini
mengikuti aturan 2 tanpa pengecualian:

- rate limit → `auth/server/repositories/mysql-rate-limit-repository.ts`;
- daftar chat Telegram admin dan pemeriksaan indeks unik Telegram →
  `auth/server/repositories/accounts/telegram.ts`. Modul `monitoring` memanggil pemeriksaan
  ini lewat layanan `auth/server/auth-readiness.ts`, karena tabel `auth_users` milik modul `auth`;
- penyimpanan perangkat yang dibuat otomatis →
  `devices/server/repositories/mysql-device-provisioning-repository.ts`;
- pemeriksaan koneksi database untuk `/api/ready` →
  `monitoring/server/repositories/mysql-health-repository.ts`.

Teks SQL dan urutan langkah tidak berubah. Sebelum pemindahan, rate limit dan pembuatan
perangkat otomatis diberi tes integrasi MySQL lebih dulu.
