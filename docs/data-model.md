# Model Data

Dokumen ini menjelaskan data utama yang dipakai dalam sistem monitoring.

## Gambaran Awam

Sistem ini memiliki beberapa objek utama:

```text
Lokasi
  -> Tangki
  -> Device
  -> Reading
```

Artinya:

- satu lokasi bisa memiliki satu atau beberapa tangki;
- satu tangki dipantau oleh device;
- device mengirim banyak reading;
- reading dipakai untuk membuat status dan grafik.

Batch 19 menambah alur onboarding perangkat:

```text
User mengajukan perangkat
  -> Admin meninjau
  -> Sistem membuat device key dan paket firmware
  -> User download firmware
  -> Device kirim data pertama
  -> Site, tangki, dan device aktif di dashboard
```

## Site

Site adalah lokasi operasional.

Contoh:

```text
STO TPH
STO NJA
STO JTO
```

Field penting:

| Field | Arti |
|---|---|
| `id` | ID internal lokasi |
| `code` | kode pendek lokasi |
| `name` | nama lokasi |
| `areaLabel` | label area |
| `coordinate` | koordinat manual contoh |
| `markerLeft` / `markerTop` | posisi marker pada peta ilustratif |

## Tank

Tank adalah tangki bahan bakar.

Field penting:

| Field | Arti |
|---|---|
| `id` | ID tangki |
| `siteId` | lokasi tangki |
| `name` | nama tangki |
| `shape` | bentuk tangki |
| `capacityLiter` | kapasitas maksimum |
| `diameterCm` | diameter jika tabung horizontal |
| `lengthCm` | panjang jika tabung horizontal |
| `sensorMountHeightCm` | tinggi referensi sensor |
| `consumptionLiterPerHour` | asumsi konsumsi per jam |
| `lowLevelPercent` | batas level rendah |
| `criticalLevelPercent` | batas level kritis |

## Device

Device adalah perangkat yang mengirim data.

Field penting:

| Field | Arti |
|---|---|
| `id` | ID internal device |
| `code` | kode device yang dipakai di header |
| `siteId` | lokasi device |
| `tankId` | tangki yang dipantau |
| `label` | nama device |
| `expectedReportIntervalSec` | interval kirim yang diharapkan |
| `apiKeyHash` | hash key device untuk validasi ingest |
| `isActive` | device aktif atau tidak |

Contoh device aktif:

```text
code: demo-tph-01
tankId: tank-tph-main
expectedReportIntervalSec: 300
```

Artinya device diharapkan mengirim data setiap 5 menit.

## Pengajuan Perangkat

Pengajuan perangkat adalah data sementara sebelum device benar-benar aktif.
Tujuannya agar user lapangan tidak perlu membuat kode device dan key manual.

Field penting:

| Field | Arti |
|---|---|
| `requestCode` | kode pengajuan yang mudah dilacak admin |
| `requesterEmail` | email user yang mengajukan |
| `status` | status review dan provisioning |
| `siteName` / `areaLabel` | nama STO dan wilayah |
| `latitude` / `longitude` | koordinat manual untuk peta |
| `deviceCode` | kode device yang dibuat sistem |
| `deviceSensorType` | tipe sensor, saat ini fokus ke sensor fuel |
| `tankShape` | bentuk tangki, balok atau silinder horizontal |
| `capacityLiter` | kapasitas tangki yang diinput user |
| `lengthCm`, `widthCm`, `heightCm`, `diameterCm` | dimensi fisik tangki sesuai bentuk |
| `sensorMountHeightCm` | tinggi sensor dari atas tangki |
| `loadValue`, `loadUnit`, `dieselEngineCapacityKva`, `cosPhi` | parameter beban genset untuk menghitung konsumsi solar per jam |
| `hardwareProfileId` | profile board, sensor, dan pin yang dipakai firmware |
| `firmwareTemplateId` | template firmware yang dipakai untuk membuat ZIP |

Status penting:

| Status | Arti |
|---|---|
| `pending_admin_review` | menunggu admin approve/reject |
| `approved_package_ready` | paket firmware sudah dibuat |
| `waiting_firmware_download` | link firmware sudah dikirim dan menunggu download |
| `waiting_first_valid_ping` | firmware sudah didownload, menunggu device mengirim data valid |
| `active` | device sudah aktif dan tampil di dashboard |
| `rejected` / `revoked` / `expired` | pengajuan tidak bisa dipakai lagi |

## Paket Firmware

Paket firmware adalah ZIP yang dibuat setelah admin menyetujui pengajuan.

Isi paket:

```text
solar_tank_firmware.ino
device_config.h
hardware_profile.h
README_LANGKAH_UPLOAD.md
manifest.json
```

Paket firmware berisi device key dan konfigurasi yang sudah dibuat dari data
pengajuan. Di database, isi ZIP disimpan terenkripsi memakai
`DEVICE_PACKAGE_ENCRYPTION_KEY`. Link download punya masa berlaku dan batas
jumlah download supaya device key tidak tersebar terlalu bebas.

## Reading

Reading adalah satu catatan pembacaan.

Field penting:

| Field | Arti |
|---|---|
| `id` | ID reading |
| `deviceId` | device pengirim |
| `tankId` | tangki yang dibaca |
| `measuredAt` | waktu pengukuran dari device atau fallback server |
| `receivedAt` | waktu server menerima data |
| `sensorDistanceCm` | jarak sensor ke permukaan |
| `fuelHeightCm` | tinggi bahan bakar |
| `volumeLiter` | estimasi volume |
| `fillPercent` | persentase isi |
| `runtimeHour` | estimasi durasi operasional |
| `batteryVolt` | tegangan device jika ada |
| `rssiDbm` | sinyal WiFi jika ada |
| `rawPayload` | payload mentah untuk audit development |
| `quality` | catatan sumber angka dan status review config jika payload membawa config tangki |

`quality` membantu menjawab:

- waktu ukur berasal dari device atau fallback server;
- volume berasal dari device atau dihitung backend;
- persen berasal dari device atau dihitung backend;
- runtime berasal dari device atau dihitung backend;
- config payload cocok atau berbeda dari registry.

Jika config payload berbeda jauh dari registry, reading bisa membawa status:

```text
config_mismatch
```

Dashboard/detail kemudian dapat memberi tanda bahwa data perlu review, bukan diam-diam dianggap aman.

Catatan waktu:

- `measuredAt` dan `receivedAt` disimpan sebagai waktu UTC dan keluar dari API sebagai ISO string berakhiran `Z`;
- UI operasional menampilkan label jam dalam WIB/Asia Jakarta supaya hasil lokal dan Vercel tidak bergeser;
- jika device mengirim timestamp terlalu jauh dari waktu server, sistem memakai waktu server dan menambahkan warning di `quality`.

## Status

Status dibuat dari data reading dan konfigurasi.

Jenis status:

| Status | Berdasarkan |
|---|---|
| `runtimeStatus` | estimasi runtime |
| `levelStatus` | persentase isi |
| `deviceStatus` | umur data terakhir |
| `operationalStatus` | gabungan status utama |

## Catatan Penyimpanan Saat Ini

Saat ini aplikasi memiliki dua mode penyimpanan reading:

| Mode | Fungsi |
|---|---|
| `memory` | Default development, data hilang saat server restart |
| `mysql` | Reading disimpan ke MySQL lewat repository opsional |

Karakteristik memory store:

- cepat untuk development;
- tidak butuh database;
- saat server start, data demo digeser relatif ke waktu berjalan agar status awal tidak basi;
- hilang saat dev server restart;
- tidak cocok untuk production;
- cocok untuk membuktikan alur simulator dan API.

Karakteristik MySQL saat ini:

- sudah memiliki migration dan seed demo;
- menyimpan reading dari endpoint ingest;
- query history tangki mengambil riwayat per tangki;
- query overview mengambil reading terbaru per tangki agar tank yang jarang mengirim tidak tersisih oleh data tank lain yang lebih sering masuk;
- nilai `DATETIME` MySQL diperlakukan sebagai UTC oleh repository aplikasi;
- sudah dapat membaca registry site, tank, device, dan hash key dari database;
- dapat diisi registry pilot melalui file lokal yang tidak di-commit;
- tetap membutuhkan SOP production seperti backup, restore, rotasi key, dan monitoring database.
