# Data contoh MySQL

`001_seed_demo_monitoring_reference_mysql.sql` mengisi empat lokasi fiktif beserta
tangki dan perangkatnya. Berkas ini hanya untuk pengembangan dengan database
lokal, bukan untuk mengisi atau memperbarui data pilot.

Kode lokasi `CONTOH-A` sampai `CONTOH-D`, nama `STO Contoh A` sampai
`STO Contoh D`, dan area `Area Contoh` tidak mewakili lokasi operasional.
Koordinat lokasi dikosongkan (`NULL`) agar data contoh tidak menunjuk ke tempat
nyata pada peta. Pilihan Regional dan Wilayah tetap mengikuti nilai yang diterima
aplikasi.

ID internal, kode perangkat contoh, kunci contoh, serta hubungan lokasi, tangki,
dan perangkat tetap memakai identitas yang sudah dikenal simulator. Kapasitas,
dimensi, konsumsi, ambang status, dan interval kiriman juga tetap sama.

## Menjalankan

Ikuti [panduan menjalankan secara lokal](../../README.md#menjalankan-secara-lokal)
untuk menyiapkan database dan konfigurasi. Sebelum menjalankan perintah database,
pastikan host, port, dan nama database menunjuk ke lingkungan lokal.

Untuk database lokal kosong:

```powershell
pnpm db:setup:mysql
```

Untuk menerapkan ulang data contoh setelah migrasi tersedia:

```powershell
pnpm db:seed:mysql
```

Seed memakai `INSERT ... ON DUPLICATE KEY UPDATE`: jika ID sudah ada, nilainya
diperbarui. Menjalankannya dua kali tidak menambah lokasi, tangki, atau perangkat
yang sama. Perintah ini tetap dapat menimpa konfigurasi contoh yang telah diubah
secara manual, sehingga hanya digunakan pada database pengembangan.

Perubahan seed tidak mengubah database yang sudah berjalan sampai perintahnya
dijalankan secara eksplisit. Alamat dan cara memakai simulator tetap mengikuti
panduan di README utama.

## Data contoh dalam memori

Mode `SOLAR_TANK_STORAGE_DRIVER="memory"` memakai lima lokasi contoh dari
`src/features/monitoring/data/mock-sites.ts`, bukan empat lokasi dari seed MySQL.
Nama, kode tampilan, dan area memakai `STO Contoh A` sampai `STO Contoh E`,
`CONTOH-A` sampai `CONTOH-E`, serta `Area Contoh`. Koordinat tidak diisi.
Empat lokasi yang berbagi ID dengan seed MySQL memakai nama dan kode fiktif yang
sama; satu lokasi tambahan hanya ada di contoh memori.

ID internal serta kode perangkat contoh tetap dipertahankan untuk simulator dan
hubungan data. Nilai tangki, pembacaan, konsumsi, ambang, interval, dan kunci contoh
juga tetap. Identitas teknis lama tersebut bukan daftar lokasi pilot. Perubahan
berkas contoh memori tidak memperbarui registry atau data di MySQL.
