# Arsitektur Sistem

Status: **terkini**, diperiksa terhadap kode pada 25 Oktober 2026.
Arah jangka panjang dicatat di [catatan keputusan](decisions/README.md). Versi tanpa
istilah pemrograman: [cara kerja FTM](cara-kerja-ftm.md).

## Ringkasan

FTM adalah **satu aplikasi Next.js** (kerangka kerja web yang memuat halaman dan
API sekaligus) yang ditulis dalam TypeScript dan menyimpan data di MySQL. Aplikasi
ini menerima data dari perangkat ESP8266 di lapangan, menyimpannya, lalu
menampilkannya di dashboard.

```mermaid
flowchart TB
  subgraph Lapangan
    DEV[Perangkat ESP8266 + HC-SR04<br/>firmware v1]
  end
  subgraph Aplikasi[Aplikasi FTM - Next.js]
    PROXY[src/proxy.ts<br/>cek cookie untuk /dashboard]
    RH[Route handler src/app/api/*]
    PG[Halaman server src/app/**/page.tsx]
    SA[Server action src/app/**/actions.ts]
    subgraph Modul[src/features]
      MON[monitoring]
      AUTH[auth]
      HD[helpdesk]
    end
  end
  DB[(MySQL)]
  SMTP[Email SMTP]
  TG[Telegram Bot API]
  OSM[Tile peta OpenStreetMap]

  DEV -->|HTTPS POST /api/ingest| RH
  RH --> MON
  RH --> AUTH
  RH --> HD
  PG --> MON
  PG --> AUTH
  SA --> MON
  SA --> AUTH
  MON --> DB
  AUTH --> DB
  HD --> DB
  AUTH --> SMTP
  MON --> SMTP
  AUTH <-->|webhook| TG
  HD --> TG
  PG -. browser memuat tile .-> OSM
```

Penjelasan diagram:

- **Route handler** (`src/app/api/**/route.ts`) adalah pintu API: menerima data
  perangkat, login, data dashboard, ekspor CSV, unduhan paket firmware, helpdesk,
  pemeriksaan kesehatan, dan webhook Telegram.
- **Halaman server** dirender di server dan membaca data lewat modul.
- **Server action** (fungsi server yang dipanggil langsung dari formulir) dipakai
  untuk aksi admin dan pengajuan perangkat.
- **Modul** di `src/features/` memuat logika dan akses database.
- Aplikasi tidak punya proses latar belakang: tidak ada tugas terjadwal, backup
  otomatis, atau alarm.

## Modul

| Modul                     | Isi utama                                                                                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/monitoring` | Perhitungan domain (volume, status, sisa jam genset, kapasitas, konsumsi), normalisasi kiriman perangkat, registry lokasi/tangki/perangkat, penyimpanan pembacaan, penerimaan data perangkat, pemeriksaan kesiapan, ekspor CSV, komponen dashboard, peta, grafik, dan visual 3D         |
| `src/features/auth`       | Akun, sesi, peran, OTP admin, CSRF (pengaman agar aksi tidak bisa dipicu dari situs lain), captcha, email, pembatas jumlah permintaan, audit, dan Telegram (binding, perintah, notifikasi admin)                                                                                        |
| `src/features/helpdesk`   | Widget bantuan di web dan relay pesan ke topik Telegram                                                                                                                                                                                                                                 |
| `src/components`          | Kerangka halaman bersama (header, footer, menu, halaman akun) dan logo                                                                                                                                                                                                                  |
| `src/lib`                 | Utilitas umum: format angka/tanggal (`format.ts`), angka (`math.ts`), HTML aman (`html.ts`), pesan error yang aman ditampilkan, pembantu HTTP `src/lib/http/`, pengaturan SMTP `src/lib/email/`, katalog pengaturan `src/lib/config/`, dan koneksi database bersama `src/lib/database/` |

Di dalam modul, setiap jenis berkas punya foldernya sendiri:

- **logika murni** (tanpa database) dan **view model** di `domain/`, misalnya
  `tank-volume.ts`, `status.ts`, `normalize-reading.ts`, `dashboard-view-model.ts`;
- **layanan** (alur kerja yang menggabungkan beberapa langkah) di `server/`, misalnya
  `monitoring/server/ingest-telemetry.ts` dan `auth/server/auth-service.ts`;
- **repositori** (kueri SQL) di `server/repositories/`, bernama `mysql-*-repository.ts`;
- **komponen** tampilan di `components/`.

Modul yang sudah memakai bentuk folder ADR 0011:

```text
src/features/helpdesk/
├── components/helpdesk-widget.tsx         tombol dan jendela bantuan
├── server/
│   ├── helpdesk-service.ts                pintu untuk src/app
│   ├── helpdesk-notifications.ts          kabar pesan baru ke admin
│   ├── helpdesk-telegram.ts               relay balasan dari Telegram
│   └── repositories/mysql-helpdesk-repository.ts   kueri SQL
└── types/helpdesk.ts

src/features/auth/
├── components/          tombol keluar, widget captcha, pengaturan captcha formulir
├── domain/              validasi isian akun, aturan alamat tujuan setelah login, label peran
├── server/              layanan akun, sesi, guard, CSRF, kripto, pengaturan auth,
│                        email, captcha, Telegram, pembatas permintaan, kesiapan skema;
│                        auth-service.ts (pintu kompatibilitas) dan auth-flows/: login,
│                        pendaftaran, kata sandi, verifikasi email, sesi, Telegram
│   └── repositories/    mysql-auth-repository.ts (pintu kompatibilitas) dan accounts/:
│                        pengguna, sesi, administrasi pengguna, pengajuan akses, token
│                        (OTP, atur ulang sandi, verifikasi email), Telegram, audit
├── tests/
└── types/auth.ts

src/features/monitoring/
├── components/          dashboard, peta, grafik, jam, kontrol muat ulang, visual 3D,
│                        jeda muat ulang dashboard (refresh-interval.ts)
├── data/                data contoh untuk mode penyimpanan memori (konstanta murni)
├── domain/              rumus volume, status, sisa jam genset, normalisasi kiriman,
│                        ringkasan 5 menit, view model dashboard dan detail tangki, ekspor CSV
├── server/              penyimpanan, registry, penerimaan data perangkat, pemeriksaan kesiapan
│   └── repositories/    kueri SQL pembacaan dan registry
├── tests/
└── types/monitoring.ts
```

Koneksi database bersama ada di `src/lib/database/mysql-connection.ts` karena dipakai
semua modul; hanya repositori yang boleh memakainya (dicek ESLint).

```text
src/features/devices/
├── components/                warna lencana status pengajuan
├── domain/                    device-request.ts: validasi pengajuan, kapasitas tangki, konsumsi,
│                              label status, ambang awal; device-request-constants.ts: alamat
│                              halaman dan frasa konfirmasi
├── server/                    layanan pengajuan, pembuatan perangkat dari kiriman pertama,
│                              kunci perangkat, paket firmware, email paket, notifikasi admin,
│                              pengenal error skema pengajuan
│   └── repositories/          mysql-device-request-repository.ts (pintu kompatibilitas)
│                              dan device-requests/ (SQL menurut tanggung jawab)
└── tests/                     termasuk snapshot paket firmware v1 dan tes MySQL pemasangan
```

Modul `devices` memakai tipe data dan rumus dari `monitoring` (tangki, lokasi, angka).
`monitoring/server/ingest-telemetry.ts` mengaktifkan perangkat pada kiriman pertama lewat
layanan `devices`, bukan langsung ke repositorinya. Impor antar-modul selalu memakai alias
`@/features/<modul>/...`; impor di dalam modul memakai jalur relatif. ESLint menolak alias
yang menunjuk ke modul sendiri.

```text
src/features/admin/
├── domain/maintenance-confirmations.ts   frasa konfirmasi aksi perawatan data
├── server/maintenance-service.ts      reset pembacaan, pembersihan data uji, reset data perangkat
│   └── repositories/mysql-maintenance-repository.ts   kueri SQL perawatan data
└── tests/                            termasuk tes MySQL cakupan reset pembacaan
```

Semua modul kini memakai bentuk folder ADR 0011; folder `lib/` lama tidak ada lagi.

Komponen yang hanya dipakai satu halaman disimpan di folder `_components/` di samping
`page.tsx` halaman itu, misalnya `src/app/_components/` (bagian-bagian halaman depan) dan
`src/app/dashboard/tanks/[tankId]/_components/`. Awalan `_` membuat Next.js tidak
menjadikannya alamat halaman (_private folder_). Komponen yang dipakai beberapa halaman
tetap di `components/` modulnya atau di `src/components/`.

## Lapisan dan arah ketergantungan

Arah yang dituju (ADR [0002](decisions/0002-satu-repositori-modular-monolith.md),
rinciannya di ADR [0011](decisions/0011-struktur-modul-dan-aturan-lapisan.md): daftar
modul `monitoring`, `devices`, `auth`, `helpdesk`, `admin`; bentuk folder
`components/`, `domain/`, `server/`, `server/repositories/`, `types/`):

```text
src/app (halaman, route handler, server action — tipis)
    → layanan modul
        → repositori (SQL)
            → koneksi database
```

Logika murni tidak boleh mengakses database dan hanya ada di satu tempat.

Pengajuan perangkat memakai pintu layanan
`src/features/devices/server/device-request-service.ts`. Dua halaman pengajuan,
aksi formulir pengguna dan admin, serta route unduhan paket memanggil layanan ini.
Selama transisi, layanan meneruskan fungsi repositori yang sama melalui pintu
kompatibilitas `server/repositories/mysql-device-request-repository.ts`. Implementasi SQL
berada di `server/repositories/device-requests/`, dipisahkan menurut tanggung jawab:

| Berkas                                                                     | Tanggung jawab                                                                                           |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `requests.ts`                                                              | Daftar, pembuatan, dan pembacaan pengajuan dengan penguncian baris                                       |
| `review.ts`                                                                | Persetujuan, penolakan, dan pencabutan akses perangkat                                                   |
| `packages.ts`                                                              | Pencatatan email, pembaruan token, pembuatan ulang, dan unduhan paket                                    |
| `activation.ts`                                                            | Pemeriksaan kunci dan aktivasi pada kiriman valid pertama                                                |
| `catalog.ts`, `registry.ts`, `package-queries.ts`, `package-generation.ts` | Katalog hardware/template, registry nonaktif, kueri paket, dan pembuatan paket dalam transaksi pemanggil |
| `types.ts`, `row-mappers.ts`, `events.ts`, `shared.ts`                     | Tipe baris/hasil, pemetaan baris, pencatatan peristiwa, dan serialisasi                                  |

`index.ts` dan pintu lama mengekspor fungsi serta tipe publik yang sama secara
eksplisit. Setiap alur tetap memakai koneksi transaksi yang sama; SQL, urutan
operasi, penguncian baris, commit, rollback, dan pelepasan koneksi tidak berubah.
Seluruh berkas repositori ditandai `server-only`. Pemeriksaan akun,
CSRF, pengiriman email, dan pembaruan halaman masih berada di pemanggilnya dengan
urutan yang sama. Pemisahan modul `devices` dan pemindahan alur tersebut dilakukan
bertahap sesuai ADR 0011.

Pintu layanan lain dengan pola yang sama:

- `src/features/auth/server/`: audit keamanan akun, profil, dan manajemen pengguna;
- `src/features/helpdesk/server/helpdesk-service.ts`: route bantuan web;
- `src/features/admin/server/maintenance-service.ts`: aksi perawatan data
  (reset pembacaan, pembersihan data uji).

Sejak Oktober 2026 tidak ada lagi berkas di `src/app` yang mengimpor repositori,
koneksi database, atau `mysql2`. Aturan ini dicek ESLint (`no-restricted-imports`
di `eslint.config.mjs`), sehingga `pnpm lint` dan CI gagal bila dilanggar.
ESLint juga menolak layanan di `server/` yang memakai repositori atau koneksi database
milik modul lain (aturan 2 ADR 0011). Repositori modul sendiri diimpor dengan jalur
relatif pendek, misalnya `./repositories/...` atau `../lib/...`. Berkas di `domain/`
tidak boleh memakai database, `server/`, email, berkas, data permintaan, atau
pengaturan; aturan ini juga dicek ESLint.

Modul khusus server (repositori, koneksi database, layanan di `server/`, email,
Telegram, sesi, CSRF, kunci perangkat, paket firmware, dan konfigurasi rahasia)
diawali `import "server-only";`, sesuai panduan keamanan data Next.js. Bila salah
satunya terimpor ke komponen browser, `pnpm build` gagal dan menunjuk berkas
penyebabnya. Di tes Vitest penanda ini diganti modul kosong.

Route handler membalas lewat `src/lib/http/json-response.ts`: `jsonOk` (`{ ok: true, data }`),
`jsonError` (`{ ok: false, error }`), `jsonTooManyRequests` (429 dengan `Retry-After`),
dan `jsonCaughtError` (pesan aman untuk error yang ditangkap). Hanya `/api/ready`,
`/api/dashboard/overview`, dan unduhan paket firmware yang bentuk balasannya berbeda.

Kit UI bersama ada di `src/components/ui/`:

| Berkas               | Isi                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `card.tsx`           | `Card`: kartu putih standar (`as` untuk `section`/`article`/`div`)                                                 |
| `status-pill.tsx`    | `StatusPill`: lencana status berbentuk pil dengan titik warna                                                      |
| `section-header.tsx` | `SectionHeader`: judul bagian (label merah, judul, penjelasan); `limitDescriptionWidth` membatasi lebar penjelasan |
| `message.tsx`        | `FormErrorMessage` (kotak error formulir), `ActionMessage` (hasil aksi di dialog)                                  |
| `button-class.ts`    | `PRIMARY_BLOCK_BUTTON_CLASS`, `SECONDARY_BUTTON_CLASS` untuk `<button>` maupun `<Link>`                            |
| `status-tone.ts`     | peta warna status                                                                                                  |

Tes `ui-kit.test.tsx` memastikan setiap komponen menghasilkan HTML yang sama persis
dengan markup lama.

Warna status (lencana dan titik penanda) diambil dari satu peta,
`src/components/ui/status-tone.ts`: `success` hijau, `warning` kuning, `danger` merah,
`neutral` abu-abu, `info` biru. Warna isi grafik dan hiasan tidak termasuk peta ini.

Angka dan tanggal untuk teks yang dilihat pengguna ditulis lewat `src/lib/format.ts`
(`formatNumber`, `formatDateTimeJakarta`, `formatDateTimeOrDash`, `formatRuntimeHour`), dipakai
halaman, komponen, email, dan pesan Telegram.

Pembantu kecil yang dulu disalin di beberapa berkas kini ada di satu tempat:

- `src/lib/math.ts`: `clamp`, `clampPercent`;
- `src/lib/html.ts`: `escapeHtml` untuk isi email;
- `src/lib/email/smtp-config.ts`: `hasSmtpConfig`, `getSmtpPort`;
- `src/lib/http/request.ts`: `getRequestIp`, `getClientKey`, `getStringPayloadValue`;
- `src/lib/http/form-data.ts`: `getRequiredFormValue` untuk server action;
- `src/lib/database/row-values.ts`: `toNumber`, `toBoolean` untuk repositori.

Di modul monitoring, hitungan yang sama untuk dua peta ada di `components/map-tiles.ts`,
pembantu view model di `domain/view-model-helpers.ts`, hitungan hari tampilan (zona Jakarta)
di `domain/display-day.ts`, dan bentuk tangki dari kolom database di `domain/tank-shape.ts`.

Semua pengaturan dibaca dari dua katalog di `src/lib/config/`:

- `server-env.ts`: pengaturan dan rahasia yang hanya boleh dibaca server (database,
  email, kunci, Telegram, aturan akun), dikelompokkan dan diberi penjelasan singkat;
- `public-env.ts`: tiga nilai `NEXT_PUBLIC_*` yang memang ikut terkirim ke browser.

Nilai dibaca saat dipakai, sama seperti membaca `process.env` langsung. ESLint
(`no-restricted-properties`) menolak `process.env` di luar katalog ini, kecuali di tes.

Penyimpangan yang **masih ada** per 27 Oktober 2026. Semuanya menunggu keputusan pemilik
karena merapikannya mengubah tampilan atau perilaku:

- ambang status sisa jam genset ditulis di tiga tempat dengan kelas yang berbeda
  (`status.ts` dan dua halaman detail tangki);
- kartu metrik di halaman detail tangki, ringkasan tangki, dan formulir pengajuan perangkat
  mirip tetapi berbeda ukuran dan susunan; markup yang identik (kartu, lencana status, judul
  bagian, pesan, tampilan error) sudah memakai kit UI;
- dua halaman detail tangki (`/dashboard/tanks/[id]` dan `/dashboard/ringkas/tanks/[id]`) hanya
  berbagi 3 fungsi yang identik; tabel ambang sisa jam, lencana, dan panelnya sengaja bergaya
  berbeda. Menyatukannya mengubah tampilan dan menunggu keputusan pemilik. Halaman besar
  (`/dashboard/tanks/[id]`, `/dashboard/admin/users`) dan repositori besar sudah dipecah;
- dua peta interaktif (`operational-map.tsx` dan `simple-dashboard-map.tsx`) memuat rumus
  proyeksi peta yang sama, kecuali satu hal: hanya peta ringkas yang membatasi lintang ke ±85°.
  Menyatukannya ke satu modul berarti mengubah perilaku peta operasional untuk lintang di atas 85°;
- teks halaman error dashboard dan detail tangki memuat petunjuk pengembang
  (`MYSQL_DATABASE_URL`, `.env.local`, `pnpm dev`) yang ikut terlihat pengguna;
- halaman depan memuat tiga kode STO pilot, dan formulir pengajuan perangkat memakai contoh
  isian nama STO, nama kota, serta koordinat di sekitar lokasi pilot. Keduanya teks yang
  dilihat pengguna; menggantinya dengan contoh fiktif adalah perubahan tampilan (FTM-028);
- teks layar lain juga memuat lokasi sungguhan: label kantor di halaman profil, kartu contoh
  berkode STO pilot di layar masuk/daftar (`auth-shell.tsx`), serta contoh nama pengguna dan
  contoh alasan di formulir daftar. Titik tengah bawaan kedua peta (dipakai bila belum ada lokasi
  berkoordinat) juga berada di sekitar lokasi pilot. Alias teknis data contoh (`site-tph`,
  `tank-tph-main`, `demo-tph-01`) dipakai seed, penyimpanan memori, dan tes; menggantinya ikut
  mengubah alamat halaman contoh (FTM-028);
- `pnpm pilot:smoke` memakai kode perangkat bawaan yang berkode STO pilot bila `--device` dan
  `PILOT_DEVICE_ID` kosong, dan teks bantuannya memakai kode yang sama. Menggantinya mengubah
  perilaku skrip;
- teks `--help` `pnpm pilot:smoke` dan `pnpm pilot:registry` masih menulis contoh
  `pnpm <skrip> -- --opsi`. Bentuk itu ditolak skripnya ("Argumen tidak dikenal: --") karena
  pnpm 9 ikut meneruskan tanda `--`; yang benar `pnpm <skrip> --opsi`. Teks bantuan sengaja
  belum diubah karena termasuk keluaran skrip;
- formulir admin "Bersihkan semua data perangkat" dan "Bersihkan pengajuan terpilih"
  dicabut dari halaman pada Juli 2026, tetapi server action `resetMonitoringDeviceDataAction`,
  layanan, dan kueri SQL di belakangnya masih ada tanpa pemakai. Komponen formulirnya sudah
  dihapus; menghapus atau menampilkan kembali kemampuan itu menunggu keputusan pemilik;
- jumlah liter ditulis dengan dua cara: `/dashboard/detail` (termasuk petanya) dan teks
  halaman `/dashboard/tanks/[id]` menampilkan sampai 3 angka desimal, sedangkan dashboard
  utama, halaman `/dashboard/ringkas/tanks/[id]`, dan grafik volume di kedua halaman tangki
  membulatkan ke bilangan bulat. Keduanya sudah memakai `formatNumber` dengan jumlah
  desimal tertulis jelas; penyeragamannya adalah perubahan tampilan dan menunggu
  keputusan pemilik.

### Berkas yang panjangnya di atas 400 baris

Aturan proyek: berkas di atas kira-kira 400 baris perlu alasan tertulis, dan berkas di atas kira-kira
800 baris dipecah. Per 31 Oktober 2026 tidak ada berkas di atas 800 baris. Berkas berikut tetap utuh
dengan alasan yang tertulis; nama tanpa awalan berada di `src/features/`, nama halaman di `src/app/`.

| Berkas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Kenapa tetap satu berkas                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `devices/domain/device-request.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Validasi pengajuan perangkat: `validateDeviceRequestDraft` (kira-kira 330 baris) memeriksa semua isian berurutan, dan rumus kapasitas, konsumsi, serta kode pengajuan dipakai validasi itu. |
| `monitoring/domain/reading-tank-config.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Membaca konfigurasi tangki dari kiriman perangkat dan membandingkannya dengan registry. Pembantu kecilnya saling memakai, dan perilakunya bagian dari kontrak perangkat v1.                 |
| `monitoring/domain/normalize-reading.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Normalisasi satu kiriman perangkat. Urutan langkahnya bagian dari kontrak perangkat v1.                                                                                                     |
| `monitoring/server/ingest-telemetry.ts`, `devices/server/device-provisioning.ts`                                                                                                                                                                                                                                                                                                                                                                                                                   | Alur penerimaan data dan pembuatan perangkat otomatis yang berjalan berurutan, juga bagian dari kontrak perangkat v1.                                                                       |
| `devices/server/firmware-package.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Satu alur pembuatan paket firmware: isi templat, ZIP, dan enkripsi. Keluarannya dikunci tes snapshot v1.                                                                                    |
| `firmware/templates/solartank-esp8266-ultrasonic-v1/solar_tank_firmware.ino`                                                                                                                                                                                                                                                                                                                                                                                                                       | Templat firmware v1 dibekukan.                                                                                                                                                              |
| `admin/server/repositories/mysql-maintenance-repository.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                        | Empat transaksi perawatan data. Urutan penghapusan antartabel lebih aman dibaca utuh di satu tempat.                                                                                        |
| `auth/server/repositories/accounts/user-admin.ts`, `devices/server/repositories/device-requests/packages.ts`, `monitoring/server/repositories/mysql-reading-repository.ts`, `helpdesk/server/repositories/mysql-helpdesk-repository.ts`                                                                                                                                                                                                                                                            | Sudah hasil pemecahan per tugas. Tiap fungsi berisi satu kueri atau satu transaksi.                                                                                                         |
| `monitoring/server/deployment-probes.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Daftar pemeriksaan `/api/ready`. Tiap pemeriksaan pendek dan berdiri sendiri.                                                                                                               |
| `monitoring/domain/tank-detail-view-model.ts`, `monitoring/domain/simple-tank-detail-model.ts`, `monitoring/domain/dashboard-view-model.ts`                                                                                                                                                                                                                                                                                                                                                        | Model tampilan murni: satu fungsi pembangun beserta pembantu kecilnya, dilindungi tes.                                                                                                      |
| `scripts/apply-pilot-registry.mjs`, `scripts/smoke-pilot-ingest.mjs`                                                                                                                                                                                                                                                                                                                                                                                                                               | Skrip mandiri yang dijalankan `node` tanpa build, jadi sengaja satu berkas.                                                                                                                 |
| `dashboard/admin/device-requests/actions.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Kumpulan server action satu halaman. Tiap action pendek.                                                                                                                                    |
| `dashboard/detail/page.tsx`, `dashboard/ringkas/tanks/[tankId]/page.tsx`, `dashboard/tanks/[tankId]/page.tsx`, `dashboard/admin/users/page.tsx`                                                                                                                                                                                                                                                                                                                                                    | Satu komponen halaman dengan markup panjang. Bagian yang dipakai ulang sudah dipisah; pemecahan lanjutan baru berguna saat tampilan dibenahi.                                               |
| `dashboard/devices/request/device-request-form.tsx`, `dashboard/admin/device-requests/admin-device-requests-panel.tsx`, `dashboard/admin/users/admin-action-controls.tsx`, `dashboard/account/security/security-panel.tsx`, `monitoring/components/simple-dashboard-cards.tsx`, `monitoring/components/simple-tank-volume-chart.tsx`, `monitoring/components/operational-map.tsx`, `monitoring/components/simple-dashboard-map.tsx`, `monitoring/components/tank-3d/horizontal-cylinder-scene.tsx` | Satu komponen interaktif beserta keadaannya. Pemecahannya ditunda sampai tampilan dibenahi, supaya perilaku tidak berubah tanpa tes tampilan.                                               |

## Alur penerimaan data perangkat

```mermaid
sequenceDiagram
  participant D as Perangkat
  participant R as /api/ingest
  participant I as ingestTelemetry
  participant DB as MySQL
  D->>R: POST JSON + X-Device-Id + X-Api-Key/X-Device-Key
  R->>DB: cek pembatas permintaan (120 per menit per perangkat dan alamat)
  R->>I: identitas, kunci, isi kiriman
  I->>DB: baca registry, cocokkan hash kunci
  I->>DB: aktifkan perangkat baru pada kiriman valid pertama
  I->>I: normalisasi: registry vs konfigurasi dari perangkat
  I->>DB: satu transaksi: upsert snapshot terbaru + upsert ringkasan 5 menit
  R-->>D: 201 (sukses) atau 400/401/404/429/500
```

- **Snapshot terbaru** (`monitoring_latest_readings`): satu baris per perangkat,
  selalu ditimpa kiriman terbaru. Sumber tampilan langsung.
- **Ringkasan 5 menit** (`monitoring_readings`): satu baris per perangkat per
  5 menit dengan rata-rata berjalan, minimum, maksimum, dan jumlah sampel. Waktu
  bucket memakai **waktu terima server**. Sumber grafik dan ekspor.
- Konfigurasi tangki yang dikirim perangkat dibandingkan dengan registry. Bila
  berbeda jauh, nilai perangkat diabaikan dan server menghitung ulang dengan
  registry.

Format kiriman ini adalah **kontrak perangkat v1** dan dibekukan (lihat
[kontrak API](api-contract.md) dan
[ADR 0006](decisions/0006-kontrak-perangkat-berversi.md)).

## Alur pemasangan perangkat baru

1. Petugas mengisi formulir pengajuan (lokasi, dimensi tangki, beban genset).
2. Server menghitung kapasitas dan perkiraan konsumsi, lalu menyimpan pengajuan.
3. Admin menyetujui. Dalam satu transaksi dengan penguncian baris, server membuat
   lokasi, tangki, dan perangkat (belum aktif), kunci perangkat, serta paket
   firmware ZIP yang disimpan terenkripsi.
4. Tautan unduh bertoken (dengan masa berlaku dan batas jumlah unduhan) dikirim
   ke email pengaju.
5. Petugas mengisi Wi-Fi, meng-_compile_, dan mengunggah firmware ke perangkat.
6. Kiriman valid pertama dengan kunci yang cocok mengaktifkan lokasi, tangki, dan
   perangkat.

## Akses dan peran

- Halaman `/dashboard/*` membutuhkan sesi login. `src/proxy.ts` mengarahkan
  pengunjung tanpa cookie sesi ke `/login`.
- Peran `admin` membuka analisis teknis, detail teknis tangki, tinjauan pengajuan,
  manajemen pengguna, dan audit. Peran `user` membuka dashboard, detail ringkas
  tangki, pengajuan perangkat, profil, dan keamanan akun.
- Semua akun aktif melihat semua lokasi. Belum ada pembatasan per lokasi
  ([ADR 0009](decisions/0009-akses-per-lokasi.md)).

## Penyimpanan memori untuk pengembangan

Dengan `SOLAR_TANK_STORAGE_DRIVER="memory"`, registry dan pembacaan disimpan di
memori proses beserta data contoh. Mode ini hanya untuk mencoba halaman publik dan
API penerimaan data. Login dan dashboard membutuhkan MySQL.

## Alat operasional di luar aplikasi

Skrip di `scripts/` (registry pilot, smoke test, backup, pembuat admin) dijalankan
dari terminal dan menulis ke database atau alamat yang sedang diatur. Cara
pakainya ada di [kesiapan pilot](pilot-readiness.md) dan
[pencadangan database](database-backup.md). Versi dokumen arsitektur sebelum
25 Oktober 2026 tetap tersedia di riwayat Git.

## Prinsip desain

- Perangkat dan dashboard hanya berhubungan lewat API.
- Rumus operasional berada di modul domain, bukan di komponen tampilan.
- Client component (bagian tampilan yang berjalan di browser) dibuat kecil, hanya
  untuk interaksi seperti refresh otomatis, jam, peta, dan formulir.
- Tidak ada kredensial atau data operasional di repositori.
- Klaim kesiapan produksi hanya dibuat setelah dibuktikan.
