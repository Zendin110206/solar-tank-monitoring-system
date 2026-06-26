# Reviewer Quickstart

Dokumen ini untuk orang yang ingin mengecek repo dengan cepat.

## 1. Clone dan Install

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

## 3. Jalankan Pengecekan

```powershell
pnpm check
```

Perintah ini menjalankan:

```text
typecheck -> lint -> test -> build
```

## 4. Coba Simulator

Pastikan dev server masih berjalan.

Di terminal lain:

```powershell
pnpm simulate:device --device demo-tph-01 --start-percent 73 --once
```

Output yang diharapkan:

```text
[simulator] terkirim demo-tph-01 | 73% | 3650 L | jarak 40.5 cm | HTTP 201
```

## 5. Cek API Detail

```powershell
curl.exe http://localhost:3000/api/tanks/tank-tph-main
```

Cari nilai:

```text
fillPercent = 73
volumeLiter = 3650
```

## 6. Cek History

```powershell
curl.exe "http://localhost:3000/api/tanks/tank-tph-main/readings?range=24h"
```

History harus bertambah setelah simulator mengirim data.

## 7. Hal yang Perlu Dipahami Reviewer

- UI dashboard/detail membaca memory store lokal yang sama dengan endpoint API.
- Halaman login/register baru bersifat frontend-only dan belum membuat sesi pengguna.
- API sudah bisa menerima data simulator.
- Memory store hilang ketika server restart.
- Data real belum digunakan.
- Repo tidak boleh memuat credential atau data internal.

## 8. Jika Ada Error

Jika `pnpm simulate:device` gagal:

- pastikan `pnpm dev` berjalan;
- pastikan port `3000` benar;
- pastikan key sama dengan `SOLAR_TANK_LOCAL_DEVICE_KEY`;
- coba `pnpm simulate:device --help`.

Jika `pnpm check` gagal:

- baca error pertama;
- jangan push sebelum diperbaiki;
- jalankan ulang setelah perbaikan.
