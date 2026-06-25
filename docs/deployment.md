# Deployment

Dokumen ini menjelaskan status deployment dan opsi yang mungkin dipakai nanti.

## Status Saat Ini

Saat ini aplikasi belum dideploy sebagai sistem produksi.

Yang sudah aman dilakukan:

- menjalankan aplikasi lokal;
- menjalankan simulator lokal;
- menguji API lokal;
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

Build lokal:

```powershell
pnpm build
pnpm start
```

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

## Opsi Deployment Self-hosted

Untuk penggunaan internal atau pilot yang lebih serius, arah yang lebih sehat:

```text
Next.js app
  -> reverse proxy
  -> database
  -> backup
  -> monitoring server
```

Komponen yang mungkin dibutuhkan:

- Node.js runtime;
- PostgreSQL atau database lain;
- Nginx atau Caddy;
- HTTPS;
- environment variable;
- backup terjadwal;
- log aplikasi.

## Environment Variable

Jangan upload `.env.local`.

Gunakan `.env.example` sebagai referensi nama variabel.

Variabel saat ini:

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_ENV
SOLAR_TANK_LOCAL_DEVICE_KEY
```

## Checklist Sebelum Production

- Database sudah tersedia.
- Secret tidak ada di Git.
- API key device tidak memakai dummy key.
- HTTPS aktif.
- Endpoint ingest punya rate limit.
- User login dan role sudah jelas.
- Backup database disiapkan.
- Rumus volume sudah dikalibrasi.
- Device fisik diuji aman.
- Data yang ditampilkan sudah disetujui.

## Catatan Penting

Memory store saat ini hanya untuk development.

Jika server restart, data hasil simulator hilang.

Untuk deployment yang perlu history, storage harus diganti database.
