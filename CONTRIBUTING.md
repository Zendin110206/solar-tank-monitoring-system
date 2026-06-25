# Panduan Kontribusi

Dokumen ini menjelaskan cara berkontribusi ke Solar Tank Monitoring System agar pekerjaan tetap rapi, mudah ditinjau, dan aman untuk repositori publik.

## Prinsip Utama

- Gunakan Bahasa Indonesia untuk teks aplikasi dan dokumentasi utama.
- Gunakan nama file, folder, fungsi, dan variable yang konsisten serta mudah dicari.
- Jangan memasukkan data internal, credential, API key asli, password, domain produksi, atau konfigurasi jaringan privat.
- Jangan mengubah banyak hal sekaligus tanpa alasan yang jelas.
- Jalankan pengecekan lokal sebelum commit dan push.
- Jika ragu terhadap data lapangan atau keamanan, tulis asumsi di dokumentasi dan jangan mengklaim final.

## Alur Kerja Harian

Sebelum mulai:

```powershell
git status
git pull --rebase origin main
pnpm install
```

Saat mengerjakan:

```powershell
pnpm dev
```

Sebelum commit:

```powershell
pnpm check
git status
```

Setelah semua aman:

```powershell
git add .
git commit -m "type(scope): ringkasan perubahan"
git push origin main
```

## Aturan untuk Yattaqi dan Kontributor Baru

Jika baru mulai dari GitHub:

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
pnpm install
pnpm check
```

Setiap sebelum mengerjakan perubahan baru:

```powershell
git pull --rebase origin main
```

Jika muncul konflik:

```text
Berhenti dulu. Jangan asal pilih file sendiri atau file orang lain.
```

Hal yang tidak boleh dilakukan tanpa diskusi:

- `git push --force`;
- menghapus file orang lain;
- mengubah struktur besar;
- mengubah kontrak API;
- menghapus test;
- memasukkan data real;
- commit file `.env.local`.

## Format Commit

Gunakan format:

```text
type(scope): ringkasan singkat
```

Contoh:

```text
docs(readme): rapikan dokumentasi proyek
feat(simulator): tambah simulator payload device
feat(api): tambah endpoint ingest telemetry
fix(domain): perbaiki status runtime rendah
test(telemetry): tambah test memory store
chore(repo): bersihkan folder placeholder
```

Jenis commit yang umum:

| Type | Kapan dipakai |
|---|---|
| `feat` | Menambah fitur |
| `fix` | Memperbaiki bug |
| `docs` | Mengubah dokumentasi |
| `test` | Menambah atau memperbaiki test |
| `refactor` | Merapikan kode tanpa mengubah perilaku |
| `chore` | Maintenance repo, config, dependency |
| `style` | Perubahan format atau tampilan kecil |

## Standar Kode

- Pisahkan logika domain dari UI.
- Jangan menaruh rumus penting langsung di komponen halaman.
- Gunakan TypeScript type untuk bentuk data penting.
- Tambahkan test untuk logika yang memengaruhi angka operasional.
- Hindari dependency baru jika masalah bisa diselesaikan dengan fitur bawaan.
- Simpan data dummy di file data, bukan tersebar di banyak tempat.

## Standar Dokumentasi

Dokumentasi harus:

- memakai Bahasa Indonesia yang jelas;
- menjelaskan istilah teknis dengan bahasa awam jika memungkinkan;
- membedakan data dummy, simulator, dan data real;
- menyebut batasan dengan jujur;
- tidak memakai gaya percakapan personal;
- tidak memuat data privat.

## Pengecekan Wajib

Sebelum push:

```powershell
pnpm check
```

Isi `pnpm check`:

```text
typecheck -> lint -> test -> build
```

Jika salah satu gagal, perbaiki dulu sebelum push.

## Checklist Pull atau Push

Sebelum push ke `main`:

- `git pull --rebase origin main` sudah dilakukan.
- Tidak ada file rahasia.
- Tidak ada data real.
- `pnpm check` lulus.
- Commit message jelas.
- Perubahan sesuai scope.

## Catatan Tentang Branch

Untuk pekerjaan kecil dan terkoordinasi, branch `main` masih dapat dipakai.

Untuk fitur yang lebih besar, gunakan branch:

```powershell
git checkout -b feat/nama-fitur
```

Contoh:

```powershell
git checkout -b feat/dashboard-fetch-api
```

Setelah itu push branch:

```powershell
git push -u origin feat/dashboard-fetch-api
```
