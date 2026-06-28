# Reviewer Quickstart

Dokumen ini untuk orang yang ingin mengecek repo dengan cepat.

## 1. Clone dan Install

Pastikan sudah ada:

- Git;
- Node.js 20 atau lebih baru;
- pnpm 9.x.

Jika `pnpm` belum tersedia:

```powershell
corepack enable
corepack prepare pnpm@9.15.3 --activate
```

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
pnpm install
```

## 2. Jalankan Aplikasi

```powershell
pnpm dev
```

Buka:

```text
http://localhost:3000
```

Halaman yang bisa dilihat:

| URL | Isi |
|---|---|
| `/` | landing page |
| `/dashboard` | dashboard awal |
| `/dashboard/tanks/tank-tph-main` | detail tangki contoh |

## 3. Cek Aplikasi dan Storage

Cek aplikasi hidup:

```powershell
curl.exe http://localhost:3000/api/health
```

Cek storage aktif siap:

```powershell
curl.exe http://localhost:3000/api/ready
```

Jika mode default `memory` dipakai, `/api/ready` tetap sukses tetapi statusnya
`degraded` karena data memory tidak permanen. Jika mode `mysql` dipakai dan
database belum siap, `/api/ready` akan mengembalikan HTTP `503`.

## 4. Jalankan Pengecekan

```powershell
pnpm check
```

Perintah ini menjalankan:

```text
typecheck -> lint -> test -> build
```

## 5. Coba Simulator Memory Mode

Pastikan dev server masih berjalan.

Di terminal lain:

```powershell
pnpm simulate:device --device demo-tph-01 --start-percent 73 --once
```

Output yang diharapkan:

```text
[simulator] terkirim demo-tph-01 | 73% | 3650 L | jarak 40.5 cm | HTTP 201
```

Simulator otomatis memakai key demo sesuai device. Jika ingin mengisi key manual:

```powershell
pnpm simulate:device --device demo-tph-01 --key demo-tph-key --once
```

## 6. Cek API Detail

```powershell
curl.exe http://localhost:3000/api/tanks/tank-tph-main
```

Cari nilai:

```text
fillPercent = 73
volumeLiter = 3650
```

## 7. Cek History

```powershell
curl.exe "http://localhost:3000/api/tanks/tank-tph-main/readings?range=24h"
```

History harus bertambah setelah simulator mengirim data.

## 8. Hal yang Perlu Dipahami Reviewer

- UI dashboard/detail membaca storage aktif yang sama dengan endpoint API.
- `/api/health` hanya mengecek aplikasi hidup.
- `/api/ready` mengecek apakah storage aktif siap dipakai.
- Mode MySQL membaca registry site, tangki, device, dan hash key dari database.
- Halaman login/register baru bersifat frontend-only dan belum membuat sesi pengguna.
- API sudah bisa menerima data simulator.
- Saat server baru berjalan, memory mode menyiapkan data demo dengan timestamp relatif agar dashboard tidak langsung terlihat basi.
- Memory store hilang ketika server restart.
- MySQL mode tersedia untuk latihan persistent reading, tetapi belum berarti production-ready.
- Key per device sudah divalidasi memakai hash pada data dummy.
- Data real belum digunakan.
- Repo tidak boleh memuat credential atau data internal.

## 9. Coba Mode MySQL Jika Database Tersedia

Mode default tetap `memory`. Jika reviewer punya database MySQL lokal atau cloud
khusus demo, isi `.env.local`:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://user:password@host:port/database"
MYSQL_CONNECTION_LIMIT="2"
MYSQL_SSL_MODE="disabled"
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"
```

Untuk cloud MySQL yang mewajibkan TLS, gunakan:

```env
MYSQL_SSL_MODE="required"
```

Jika provider memberi CA certificate, isi `MYSQL_SSL_CA`.

Jalankan migration dan seed:

```powershell
pnpm db:setup:mysql
```

Setelah mengubah `.env.local`, restart `pnpm dev`, lalu cek:

```powershell
curl.exe http://localhost:3000/api/ready
```

## 10. Jika Ada Error

Jika `pnpm simulate:device` gagal:

- pastikan `pnpm dev` berjalan;
- pastikan port `3000` benar;
- pastikan key sesuai device, misalnya `demo-tph-key` untuk `demo-tph-01`;
- jika memakai fallback global, pastikan `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` tidak diset ke `false`;
- coba `pnpm simulate:device --help`.

Jika dashboard menampilkan "Data monitoring belum bisa dibaca":

- buka `http://localhost:3000/api/ready`;
- jika `/api/ready` HTTP `503`, cek `MYSQL_DATABASE_URL`, status database,
  SSL/allowlist provider, dan koneksi jaringan;
- jika baru mengubah `.env.local`, hentikan lalu jalankan ulang `pnpm dev`.

Jika `pnpm check` gagal:

- baca error pertama;
- jangan push sebelum diperbaiki;
- jalankan ulang setelah perbaikan.
