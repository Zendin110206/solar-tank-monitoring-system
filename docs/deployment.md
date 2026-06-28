# Deployment

Dokumen ini menjelaskan status deployment dan opsi yang mungkin dipakai nanti.

## Status Saat Ini

Saat ini aplikasi belum dideploy sebagai sistem produksi.

Yang sudah aman dilakukan:

- menjalankan aplikasi lokal;
- menjalankan simulator lokal;
- menguji API lokal;
- mengecek aplikasi hidup lewat `/api/health`;
- mengecek kesiapan storage aktif lewat `/api/ready`;
- menguji mode memory store;
- menyiapkan migration dan seed MySQL untuk latihan registry monitoring dan persistent storage;
- menjalankan setup MySQL lewat `pnpm db:setup:mysql`;
- menjalankan `pnpm check`;
- membangun production build lokal.

Yang belum dilakukan:

- database production;
- domain production;
- HTTPS production;
- auth final;
- backup;
- monitoring server;
- integrasi device fisik.

## Menjalankan Lokal

```powershell
pnpm install
pnpm dev
```

Buka:

```text
http://localhost:3000
```

Cek aplikasi hidup:

```powershell
curl.exe http://localhost:3000/api/health
```

Cek storage aktif:

```powershell
curl.exe http://localhost:3000/api/ready
```

Perbedaan penting:

```text
/api/health hanya membuktikan aplikasi hidup.
/api/ready membuktikan storage aktif siap.
```

Jika `/api/health` sukses tetapi `/api/ready` gagal, biasanya masalah ada pada
database, connection string, SSL, allowlist, atau jaringan.

Build lokal:

```powershell
pnpm build
pnpm start
```

Jika ingin mencoba storage MySQL lokal atau cloud, isi `.env.local` dengan `MYSQL_DATABASE_URL`, jalankan `pnpm db:setup:mysql`, lalu set `SOLAR_TANK_STORAGE_DRIVER="mysql"`.

Setelah mengubah `.env.local`, restart `pnpm dev`. Perubahan environment tidak
selalu terbaca hanya dengan menekan tombol refresh dashboard.

## Opsi Deployment Demo

Untuk demo tanpa data sensitif, aplikasi bisa diarahkan ke platform seperti Vercel.

Syarat:

- hanya data dummy;
- tidak ada credential asli;
- tidak ada payload real;
- tidak ada lokasi sensitif;
- env var diisi lewat dashboard platform, bukan file Git.

Kelebihan:

- mudah dibuka reviewer;
- cepat untuk validasi tampilan;
- cocok untuk demo awal.

Batasan:

- tidak otomatis cocok untuk perangkat lapangan;
- memory store tidak stabil di serverless;
- perlu database jika ingin history bertahan.
- `/api/ready` harus sukses sebelum URL demo dianggap siap dipakai reviewer.

## Opsi Deployment Self-hosted

Untuk penggunaan internal atau pilot yang lebih serius, arah yang lebih sehat:

```text
Next.js app
  -> reverse proxy
  -> MySQL database
  -> backup
  -> monitoring server
```

Komponen yang mungkin dibutuhkan:

- Node.js runtime;
- MySQL database;
- Nginx atau Caddy;
- HTTPS;
- environment variable;
- backup terjadwal;
- log aplikasi.
- health check dan readiness check untuk dipantau dari luar aplikasi.

## Environment Variable

Jangan upload `.env.local`.

Gunakan `.env.example` sebagai referensi nama variabel.

Variabel saat ini:

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL_MS
SOLAR_TANK_STORAGE_DRIVER
SOLAR_TANK_LOCAL_DEVICE_KEY
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK
SOLAR_TANK_DEVICE_KEY
MYSQL_DATABASE_URL
MYSQL_CONNECTION_LIMIT
MYSQL_SSL_MODE
MYSQL_SSL_CA
```

## Checklist Sebelum Production

- Database sudah tersedia.
- Secret tidak ada di Git.
- API key device tidak memakai dummy key.
- Fallback global device key dimatikan.
- HTTPS aktif.
- Endpoint ingest punya rate limit.
- User login dan role sudah jelas.
- Backup database disiapkan.
- Registry site, tank, device, dan key berasal dari database yang dikelola.
- Rumus volume sudah dikalibrasi.
- Device fisik diuji aman.
- Data yang ditampilkan sudah disetujui.
- `/api/health` mengembalikan HTTP 200.
- `/api/ready` mengembalikan HTTP 200 untuk storage production/pilot.

## Catatan Penting

Memory store saat ini hanya untuk development.

Jika server restart, data hasil simulator hilang.

Untuk deployment yang perlu history, storage harus memakai database. Fondasi MySQL sudah tersedia untuk registry monitoring dan reading, tetapi belum menggantikan kebutuhan auth, rate limit, audit log, backup, rotasi key, dan prosedur production.
