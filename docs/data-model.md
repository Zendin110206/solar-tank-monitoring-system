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
