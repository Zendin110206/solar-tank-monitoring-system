# Pilot Readiness 5 STO

Dokumen ini menjelaskan cara menyiapkan uji pilot 5 STO dengan data yang sudah disetujui. Fokusnya adalah membuktikan alur:

```text
device real atau smoke test
  -> POST /api/ingest
  -> MySQL
  -> dashboard
  -> detail tangki
```

Dokumen ini sengaja ditulis pelan-pelan agar bisa diikuti oleh pembaca non-IT.

## Status

Yang sudah tersedia:

- deployment demo di Vercel;
- opsi storage MySQL cloud;
- registry site/tangki/device dari MySQL;
- validasi key per device;
- normalisasi payload real device;
- review config payload vs registry;
- script apply registry pilot;
- script generate key/hash device;
- script smoke test ingest.
- peta dashboard berbasis koordinat registry.

Yang belum final:

- auth user sungguhan;
- role admin/operator/viewer;
- rate limit endpoint ingest;
- audit log request gagal;
- backup database production;
- keputusan server final;
- integrasi RTU/Modbus;
- MQTT broker.

## Prinsip Aman

Jangan commit:

- `config/pilot-registry.local.json`;
- `.env.local`;
- key device asli;
- connection string database;
- IP internal;
- koordinat yang belum boleh dibagikan;
- screenshot yang menampilkan credential.

File yang boleh di-commit hanya template aman:

```text
config/pilot-registry.example.json
```

## File Penting

| File | Fungsi |
|---|---|
| `config/pilot-registry.example.json` | contoh format registry pilot |
| `config/pilot-registry.local.json` | file real lokal, harus dibuat sendiri dan tidak boleh di-commit |
| `scripts/generate-device-key.mjs` | membuat key dan hash device |
| `scripts/apply-pilot-registry.mjs` | validasi dan apply registry ke MySQL |
| `scripts/smoke-pilot-ingest.mjs` | mengirim payload real-format untuk uji cepat |
| `docs/field-pilot-5-sto-guide.md` | panduan lapangan 5 STO dari koordinat sampai device mengirim data |

## Alur Besar

```text
1. Siapkan database MySQL.
2. Siapkan .env.local.
3. Generate key dan hash device.
4. Salin template registry ke file lokal.
5. Isi 5 STO, koordinat approved, tangki, device, dan hash.
6. Validasi registry dengan dry-run.
7. Apply registry ke MySQL.
8. Cek /api/ready.
9. Kirim smoke payload.
10. Buka dashboard dan detail.
```

## 1. Siapkan Environment

Untuk cloud MySQL seperti Aiven, `.env.local` minimal:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://user:password@host:port/database"
MYSQL_CONNECTION_LIMIT="1"
MYSQL_SSL_MODE="required"
SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"
```

Jika provider memberi CA certificate:

```env
MYSQL_SSL_CA="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

Catatan:

```text
Setelah mengubah .env.local, restart dev server.
Tombol refresh dashboard tidak membaca ulang env.
```

## 2. Jalankan Migration

Migration membuat tabel yang dibutuhkan:

```powershell
pnpm db:migrate:mysql
```

Jika gagal, cek:

- `MYSQL_DATABASE_URL`;
- SSL/CA;
- status database;
- allowlist provider jika ada;
- koneksi internet.

## 3. Generate Key dan Hash Device

Setiap device pilot harus punya key sendiri.

Jalankan:

```powershell
pnpm pilot:hash-key
```

Output akan berisi dua bagian:

```text
DEVICE_KEY_ASLI_SIMPAN_AMAN
API_KEY_HASH_UNTUK_DATABASE
```

Yang dimasukkan ke registry adalah hash:

```text
sha256:...
```

Key asli hanya dipakai di firmware/device atau saat smoke test.

Jika sudah punya key dari device:

```powershell
$env:DEVICE_KEY="key-asli-device"
pnpm pilot:hash-key
```

Script tidak akan menampilkan ulang key dari env. Script hanya menampilkan hash.

## 4. Buat Registry Lokal

Salin template:

```powershell
Copy-Item config/pilot-registry.example.json config/pilot-registry.local.json
```

Edit:

```text
config/pilot-registry.local.json
```

Yang wajib diganti:

- nama 5 STO sesuai data yang boleh dipakai;
- koordinat real yang sudah disetujui;
- `coordinateStatus` menjadi `approved`;
- kode device final;
- hash key device final;
- kapasitas dan dimensi tangki;
- interval kirim device.

Contoh bagian penting:

```json
{
  "id": "site-tph",
  "code": "TPH",
  "name": "STO TPH",
  "areaLabel": "Pilot Pasuruan",
  "latitude": -7.6500000,
  "longitude": 112.9000000,
  "coordinateStatus": "approved",
  "tank": {
    "shape": "rectangular",
    "capacityLiter": 540,
    "lengthCm": 150,
    "widthCm": 60,
    "heightCm": 60,
    "sensorMountHeightCm": 60,
    "lowLevelPercent": 30,
    "criticalLevelPercent": 15,
    "consumptionLiterPerHour": 25
  },
  "device": {
    "code": "pilot-tph-01",
    "expectedReportIntervalSec": 300,
    "apiKeyHash": "sha256:hasil_hash_di_sini"
  }
}
```

## 5. Validasi Registry Tanpa Menulis Database

Jalankan:

```powershell
pnpm pilot:registry -- --dry-run
```

Jika sukses, script menampilkan ringkasan 5 STO.

Jika gagal, ikuti pesan error. Contoh:

| Error | Arti |
|---|---|
| `coordinateStatus harus approved` | koordinat belum ditandai boleh dipakai |
| `apiKeyHash masih hash placeholder` | belum generate hash key real |
| `criticalLevelPercent harus lebih kecil` | batas kritis tidak boleh lebih tinggi dari batas low |
| `Registry pilot wajib berisi minimal 5 site aktif` | jumlah STO kurang |

## 6. Apply Registry ke MySQL

Jika dry-run sudah sukses:

```powershell
pnpm pilot:registry
```

Script akan melakukan upsert:

- `monitoring_sites`;
- `monitoring_tanks`;
- `monitoring_devices`.

Upsert artinya:

```text
Kalau data belum ada, dibuat.
Kalau data sudah ada, diperbarui.
```

Script tidak menghapus history reading.

## 7. Cek Readiness

Lokal:

```powershell
curl.exe http://localhost:3000/api/ready
```

Vercel:

```powershell
curl.exe https://solar-tank-monitoring-system.vercel.app/api/ready
```

Yang dicari:

```text
ok: true
status: ready
storageDriver: mysql
mysql: ok
mysql-reference-registry: aktif
```

## 8. Smoke Test Payload

Smoke test adalah uji kirim payload tanpa menunggu device fisik.

Lokal:

```powershell
$env:PILOT_API_BASE_URL="http://localhost:3000"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device-tph"
pnpm pilot:smoke
```

Vercel:

```powershell
$env:PILOT_API_BASE_URL="https://solar-tank-monitoring-system.vercel.app"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device-tph"
pnpm pilot:smoke
```

Default payload memakai prototype:

```text
tangki balok 150 x 60 x 60 cm
kapasitas 540 L
distance 10,2 cm
tinggi solar 49,8 cm
volume 448,2 L
isi 83%
konsumsi 25 L/jam
runtime 17,93 jam
```

Untuk melihat payload tanpa mengirim:

```powershell
pnpm pilot:smoke -- --dry-run
```

Untuk mengubah distance:

```powershell
pnpm pilot:smoke -- --distance-cm 18.5
```

Jika response `401`:

```text
Key salah atau hash di registry tidak sesuai.
```

Jika response `404`:

```text
Device belum ada di registry MySQL.
```

Jika response `503`:

```text
Database/storage belum siap. Cek /api/ready.
```

Jika response sukses tetapi `needsReview=true`:

```text
Payload masuk, tetapi config payload berbeda dari registry.
Periksa dimensi, kapasitas, shape, dan konsumsi per jam.
```

## 9. Cek Dashboard

Buka:

```text
https://solar-tank-monitoring-system.vercel.app/dashboard
```

Yang diharapkan:

- dashboard menampilkan minimal 5 STO setelah registry pilot diterapkan;
- peta dashboard menampilkan titik dari latitude dan longitude registry;
- search dan filter peta bisa menemukan STO yang dicari;
- STO yang baru dikirimi smoke payload punya data terbaru;
- status device tidak offline jika data baru masuk dan interval benar;
- detail tangki menampilkan volume, persen, runtime, dan status config.

Detail:

```text
https://solar-tank-monitoring-system.vercel.app/dashboard/tanks/tank-tph-main
```

## 10. Device Real Mengirim ke Mana

Endpoint:

```text
POST https://solar-tank-monitoring-system.vercel.app/api/ingest
```

Header:

```http
Content-Type: application/json
X-Device-Id: pilot-tph-01
X-Device-Key: key-asli-device
```

Payload minimal yang disarankan:

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

Catatan untuk firmware:

- jangan taruh key di screenshot publik;
- pastikan device ID sama dengan registry;
- pastikan key asli cocok dengan hash di database;
- pakai HTTPS;
- interval kirim mengikuti `expectedReportIntervalSec`;
- jika endpoint berubah, firmware harus diarahkan ke URL baru.
- latitude dan longitude untuk peta diambil dari registry manual, bukan dari device.

Panduan lapangan yang lebih panjang ada di:

```text
docs/field-pilot-5-sto-guide.md
```

## 11. Checklist Demo ke Tim

Sebelum demo:

```powershell
curl.exe https://solar-tank-monitoring-system.vercel.app/api/health
curl.exe https://solar-tank-monitoring-system.vercel.app/api/ready
curl.exe https://solar-tank-monitoring-system.vercel.app/api/dashboard/overview
```

Pastikan:

- `/api/health` sukses;
- `/api/ready` sukses;
- registry jumlahnya sesuai target pilot;
- smoke payload berhasil;
- dashboard berubah;
- detail angka sesuai payload;
- tidak ada credential di layar;
- data yang ditampilkan sudah boleh dibagikan.

Kalimat laporan aman:

```text
Alur pilot web monitoring sudah bisa dicoba:
registry 5 STO disiapkan di MySQL,
device mengirim payload ke /api/ingest,
API memvalidasi device dan key,
data masuk database,
dashboard membaca data terbaru,
dan detail tangki menampilkan volume, persen, runtime, serta status config.
```

## 12. Batasan Pilot

Pilot ini belum berarti production final.

Sebelum production, masih perlu:

- auth dan role;
- rate limit;
- audit log;
- backup database;
- rotasi key;
- monitoring server;
- SOP jika device offline;
- validasi keselamatan perangkat;
- persetujuan data lokasi;
- keputusan server final.
