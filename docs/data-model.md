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

Saat ini data disimpan di memory store.

Karakteristik memory store:

- cepat untuk development;
- tidak butuh database;
- hilang saat dev server restart;
- tidak cocok untuk production;
- cocok untuk membuktikan alur simulator dan API.

Target berikutnya adalah mengganti penyimpanan sementara dengan database.
