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
