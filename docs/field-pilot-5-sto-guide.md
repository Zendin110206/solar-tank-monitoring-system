# Panduan Lapangan Pilot 5 STO

Dokumen ini menjelaskan cara menjalankan uji real 5 STO dari awal sampai data tampil di dashboard. Bahasa sengaja dibuat pelan-pelan untuk pembaca non-IT.

## Gambaran Paling Sederhana

Alur yang ingin dicapai:

```text
1. Data 5 STO dimasukkan ke database.
2. Setiap STO punya satu tangki dan satu device.
3. Setiap device punya key sendiri.
4. Device mengirim data ke URL aplikasi.
5. API mengecek device dan key.
6. Data masuk MySQL.
7. Dashboard menampilkan titik peta, status, volume, persen isi, runtime, dan update terakhir.
```

Dashboard memakai peta berbasis koordinat. Titik peta tidak berasal dari GPS device, karena perangkat saat ini tidak memakai modul GPS. Titik peta berasal dari registry lokasi yang diisi manual dan disimpan di MySQL.

## Data yang Harus Disiapkan untuk 5 STO

Siapkan tabel sederhana seperti ini sebelum menyentuh kode atau device.

| Data | Contoh | Catatan |
|---|---|---|
| Kode STO | `TPH` | Kode pendek yang mudah dibaca |
| Nama lokasi | `STO TPH` | Nama yang tampil di dashboard |
| Area | `Pasuruan` | Label area kerja |
| Latitude | `-7.6500000` | Harus angka koordinat yang disetujui |
| Longitude | `112.9000000` | Harus angka koordinat yang disetujui |
| ID tangki | `tank-tph-main` | Gunakan format konsisten |
| Bentuk tangki | `rectangular` | Prototype sekarang balok |
| Kapasitas | `540` | Liter |
| Panjang | `150` | cm |
| Lebar | `60` | cm |
| Tinggi | `60` | cm |
| Tinggi sensor | `60` | cm dari dasar referensi |
| Batas rendah | `30` | persen |
| Batas kritis | `15` | persen |
| Konsumsi | `25` | liter per jam |
| Kode device | `pilot-tph-01` | Harus sama dengan firmware |
| Interval kirim | `300` | detik, berarti 5 menit |
| Hash key | `sha256:...` | Bukan key asli |

## Cara Mengambil Koordinat

Koordinat boleh diambil dari aplikasi peta yang dipakai tim, misalnya Google Maps, lalu disalin ke registry.

Cara umum di browser:

1. Buka Google Maps.
2. Cari lokasi STO atau titik genset.
3. Klik kanan pada titik yang dianggap benar.
4. Salin angka koordinat yang muncul.
5. Pastikan formatnya seperti:

```text
-7.650000, 112.900000
```

Angka pertama adalah latitude. Angka kedua adalah longitude.

Masukkan ke registry:

```json
{
  "latitude": -7.6500000,
  "longitude": 112.9000000,
  "coordinateStatus": "approved"
}
```

Penting:

- jangan memakai koordinat perkiraan jika akan demo real;
- jangan commit koordinat sensitif ke GitHub;
- titik peta sebaiknya sudah disetujui penanggung jawab lapangan;
- jika titik masih ragu, jangan set `coordinateStatus` ke `approved`.

## Cara Menyiapkan Registry 5 STO

Salin template:

```powershell
Copy-Item config/pilot-registry.example.json config/pilot-registry.local.json
```

Edit file lokal:

```text
config/pilot-registry.local.json
```

Untuk setiap STO, isi:

- `id`;
- `code`;
- `name`;
- `areaLabel`;
- `latitude`;
- `longitude`;
- `coordinateStatus`;
- `tank`;
- `device`.

File `.local.json` ini tidak boleh di-commit.

## Cara Membuat Key Device

Setiap device harus punya key sendiri.

Jalankan:

```powershell
pnpm pilot:hash-key
```

Simpan dua hasilnya:

```text
DEVICE_KEY_ASLI_SIMPAN_AMAN
API_KEY_HASH_UNTUK_DATABASE
```

Pembagian pemakaian:

```text
Key asli      -> dipasang di firmware atau dipakai saat smoke test.
Hash sha256   -> dimasukkan ke registry/database.
```

Jangan membalik dua nilai ini.

## Validasi dan Apply Registry

Validasi tanpa menulis database:

```powershell
pnpm pilot:registry -- --dry-run
```

Jika masih error, berhenti dulu dan perbaiki file registry lokal.

Jika sudah sukses:

```powershell
pnpm pilot:registry
```

Setelah apply, cek readiness:

```powershell
curl.exe https://solar-tank-monitoring-system.vercel.app/api/ready
```

Yang dicari:

```text
ok: true
status: ready
storageDriver: mysql
Registry MySQL aktif: 5 site, 5 tangki, 5 device
```

Jika masih 4 site, berarti registry 5 STO belum masuk ke MySQL yang dipakai Vercel.

## Cara Membaca Peta Dashboard

Buka:

```text
https://solar-tank-monitoring-system.vercel.app/dashboard
```

Bagian peta sekarang bisa:

- menampilkan peta real berbasis koordinat;
- menampilkan marker per STO;
- zoom in;
- zoom out;
- geser peta;
- pusatkan ulang peta;
- search STO, nama lokasi, area, atau device;
- filter semua, online, waspada, kritis, atau offline;
- hover, fokus keyboard, atau klik marker untuk mengganti kartu `Detail overview`;
- klik tombol `Buka detail tangki` pada kartu detail untuk masuk ke halaman detail.

Cara membaca peta:

1. Cari STO melalui kolom pencarian jika jumlah titik sudah banyak.
2. Pilih status jika hanya ingin melihat perangkat online, waspada, kritis, atau offline.
3. Arahkan kursor ke marker untuk melihat ringkasan singkat.
4. Klik marker jika ingin menjadikan STO tersebut sebagai pilihan aktif.
5. Baca kartu `Detail overview` di sisi kanan atau di bawah peta pada layar ponsel.
6. Klik `Buka detail tangki` jika perlu melihat sensor, konfigurasi tangki, payload, dan alur baca lebih lengkap.

Jika marker tidak muncul:

1. Cek latitude dan longitude di registry.
2. Cek `coordinateStatus` saat apply registry.
3. Cek apakah registry sudah masuk ke MySQL yang dipakai Vercel.
4. Cek koneksi internet browser, karena tile peta diambil dari OpenStreetMap.

## Endpoint Device Real

Device mengirim ke:

```text
POST https://solar-tank-monitoring-system.vercel.app/api/ingest
```

Header:

```http
Content-Type: application/json
X-Device-Id: pilot-tph-01
X-Device-Key: key-asli-device
```

`X-Device-Id` harus sama dengan kode device di registry.

`X-Device-Key` harus key asli yang hash-nya sudah dimasukkan ke database.

## Payload yang Disarankan dari Device

Payload minimal:

```json
{
  "device": "pilot-tph-01",
  "ts": 1780000000,
  "tank_shape": "rectangular",
  "capacity_liter": 540,
  "length_cm": 150,
  "width_cm": 60,
  "height_cm": 60,
  "sensor_mount_height_cm": 60,
  "low_level_percent": 30,
  "critical_level_percent": 15,
  "consumption_liter_per_hour": 25,
  "distance": 10.2,
  "distance_cm": 10.2,
  "voltage": 3.7,
  "rssi": -54,
  "raw": {
    "local_H_cm": 49.8,
    "local_volume_l": 448.2,
    "local_percent": 83,
    "wifi_rssi": -54
  }
}
```

Yang paling wajib:

- device id;
- jarak sensor;
- config tangki;
- battery jika ada;
- RSSI jika ada.

Latitude dan longitude tidak wajib dari payload, karena lokasi peta diambil dari registry manual.

## Yang Perlu Dicek di Firmware ESP8266/NodeMCU

Firmware perlu memastikan:

1. Device tersambung WiFi.
2. Device tahu URL endpoint:

```text
https://solar-tank-monitoring-system.vercel.app/api/ingest
```

3. Device mengirim metode `POST`.
4. Device mengirim header:

```text
Content-Type: application/json
X-Device-Id: kode-device
X-Device-Key: key-asli-device
```

5. Device mengirim body JSON.
6. Device mengirim tiap interval yang disepakati, misalnya 5 menit.
7. Device mencatat response HTTP.

Arti response umum:

| Response | Arti |
|---|---|
| `201` | data diterima |
| `400` | payload rusak atau field kurang |
| `401` | key salah |
| `404` | device tidak ada di registry |
| `503` | database/storage belum siap |

Catatan HTTPS:

- endpoint Vercel memakai HTTPS;
- ESP8266 perlu client HTTPS yang sesuai;
- jangan menonaktifkan validasi sertifikat untuk penggunaan final tanpa persetujuan teknis;
- kalau HTTPS di firmware bermasalah, uji dulu dengan smoke test agar tahu servernya sehat.

## Cara Smoke Test Sebelum Device Real

Smoke test lokal:

```powershell
$env:PILOT_API_BASE_URL="https://solar-tank-monitoring-system.vercel.app"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device"
pnpm pilot:smoke
```

Jika smoke test sukses tetapi device gagal, kemungkinan masalah ada di firmware, jaringan device, header, key, atau format JSON.

## Kalau Hari Uji Real Batal

Jangan mengirim data latihan ke database yang sedang dipakai demo resmi jika data itu bisa membingungkan.

Pilihan aman:

1. Pakai local development dengan storage `memory`.
2. Pakai database staging/latihan.
3. Pakai device khusus demo yang jelas bukan device lapangan.
4. Tulis di laporan bahwa data tersebut adalah uji koneksi, bukan data operasional.

Jika tetap perlu smoke test ke Vercel, gunakan device pilot yang memang disepakati untuk test dan jangan mengklaim itu data operasional.

## Checklist Sebelum Demo 5 STO

Sebelum demo:

```powershell
curl.exe https://solar-tank-monitoring-system.vercel.app/api/health
curl.exe https://solar-tank-monitoring-system.vercel.app/api/ready
curl.exe https://solar-tank-monitoring-system.vercel.app/api/dashboard/overview
```

Pastikan:

- `/api/health` sukses;
- `/api/ready` sukses;
- registry sudah 5 site, 5 tangki, 5 device;
- dashboard menampilkan 5 titik;
- setiap marker peta berada di lokasi yang benar;
- search menemukan kode STO;
- filter status bekerja;
- smoke test minimal satu device sukses;
- device real minimal satu device sukses;
- tidak ada credential di layar;
- data lokasi yang ditampilkan boleh dibagikan.

## Batas Batch Ini

Batch ini membuat pilot 5 STO semakin real dari sisi dashboard dan alur data.

Namun batch ini belum membuat:

- login final;
- admin registry di browser;
- backup database;
- audit log;
- rate limit;
- rotasi key otomatis;
- MQTT;
- RTU/Modbus;
- firmware final.

Fokusnya adalah memastikan titik peta, registry, device payload, dan dashboard bisa dipakai untuk uji real awal.
