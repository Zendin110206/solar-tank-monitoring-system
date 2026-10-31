# Model Domain dan Perhitungan

> **Status dokumen:** dicocokkan dengan kode `src/features/monitoring/domain/` pada 31 Oktober 2026.
> Rumus dan ambang di bawah dikunci tes karakterisasi; perilaku yang dicatat apa adanya ditandai.

Dokumen ini menjelaskan rumus dan status yang menjadi inti sistem monitoring.

## Konsep Utama

Sensor biasanya membaca jarak dari sensor ke permukaan cairan.

Data yang ingin dilihat pengguna adalah liter, persen, dan runtime.

Karena itu perlu konversi:

```text
distance -> fuel height -> volume -> percent -> runtime -> status
```

## Tinggi Bahan Bakar

Server menghitung tinggi bahan bakar dari jarak sensor dan **tinggi maksimum tangki**:

```text
tinggiMaksimum = diameterCm   (tangki silinder horizontal)
               = heightCm     (tangki balok)
               (bila dimensi itu kosong, dipakai sensorMountHeightCm)

fuelHeightCm = tinggiMaksimum - sensorDistanceCm
```

Hasilnya dibatasi antara 0 dan tinggi maksimum, lalu dibulatkan 2 angka desimal.

Contoh tangki silinder berdiameter 150 cm:

```text
sensorDistanceCm = 40.5
fuelHeightCm = 150 - 40.5 = 109.5
```

Bila kiriman membawa tinggi bahan bakar sendiri (misalnya `raw.local_H_cm`), nilai dari
perangkat itu yang dipakai; lihat bagian normalisasi.

## Volume Tangki Tabung Horizontal

Untuk tangki tabung tidur, volume tidak linear terhadap tinggi.

Artinya:

```text
tinggi 50% tidak bisa selalu dianggap volume 50% tanpa rumus yang benar.
```

Rumus luas segmen lingkaran:

```text
r = radius tangki
h = tinggi cairan
L = panjang tangki

area = r^2 * acos((r - h) / r) - (r - h) * sqrt(2*r*h - h^2)
volumeLiter = area * L / 1000
```

Kode perhitungan berada di:

```text
src/features/monitoring/domain/tank-volume.ts
```

## Volume Tangki Balok

Untuk tangki balok atau rectangular, volume lebih sederhana.

```text
volumeLiter = panjangCm x lebarCm x tinggiCairanCm / 1000
```

Contoh perhitungan:

```text
panjang = 150 cm
lebar   = 60 cm
tinggi cairan = 49,8 cm

volume = 150 x 60 x 49,8 / 1000
       = 448,2 liter
```

Jika kapasitas tangki 540 liter:

```text
448,2 / 540 x 100 = 83%
```

Kedua rumus volume dibulatkan 2 angka desimal dan dibatasi antara 0 dan `capacityLiter`.

Payload real-format dapat membawa config rectangular dari device. Sistem tetap membandingkan config itu dengan registry agar perbedaan besar tidak tersembunyi.

## Persentase Isi

```text
fillPercent = volumeLiter / capacityLiter * 100   (dibatasi 0–100, dibulatkan 2 angka desimal)
```

Bila kapasitas 0 atau kurang, persen isi bernilai 0.

Contoh:

```text
volumeLiter = 3650
capacityLiter = 5000
fillPercent = 73
```

## Runtime

Runtime adalah estimasi berapa jam bahan bakar cukup jika konsumsi per jam sesuai asumsi.

```text
runtimeHour = max(0, volumeLiter) / consumptionLiterPerHour   (dibulatkan 2 angka desimal)
```

Bila konsumsi per jam 0 atau kurang, runtime tidak dihitung (`null`).

Contoh:

```text
volumeLiter = 3650
consumptionLiterPerHour = 25
runtimeHour = 146
```

Kode runtime berada di:

```text
src/features/monitoring/domain/runtime.ts
```

## Status Runtime

Aturan di `status.ts` (dipakai dashboard dan status gabungan):

|         Runtime | Status                    |
| --------------: | ------------------------- |
|      `< 13 jam` | Kritis (`critical`)       |
| `13 - < 16 jam` | Waspada (`warning`)       |
| `16 - ≤ 24 jam` | Aman terbatas (`limited`) |
|      `> 24 jam` | Aman panjang (`safe`)     |
| tidak diketahui | `unknown`                 |

Catatan: dua halaman detail tangki memakai tabel ambang sisa jam sendiri (6 tingkat, batas
`< 24`), sehingga tidak persis sama dengan tabel di atas. Perbedaan ini dicatat di
[arsitektur](architecture.md) dan menunggu keputusan pemilik.

## Status Level

| Isi tangki   | Status     |
| ------------ | ---------- |
| `< 15%`      | `critical` |
| `15 - < 30%` | `low`      |
| `30 - < 50%` | `warning`  |
| `≥ 50%`      | `safe`     |

## Status Device

Device dinilai dari umur data terakhir dibanding interval kirim yang diharapkan
(`expectedReportIntervalSec` di registry):

| Umur data terakhir              | Status    |
| ------------------------------- | --------- |
| `≤ 2 × interval`                | `online`  |
| `> 2 × interval` dan `≤ 4 ×`    | `delayed` |
| `> 4 × interval`                | `offline` |
| belum ada data / interval `≤ 0` | `unknown` |

Contoh: perangkat pilot dengan interval 20 detik dianggap online bila data terakhir berumur
paling lama 40 detik, terlambat sampai 80 detik, lalu offline.

## Status Operasional

Status gabungan untuk dashboard:

- `critical` bila runtime kritis, level kritis, atau perangkat offline;
- `warning` bila runtime tidak diketahui/waspada/terbatas, level rendah/waspada, atau perangkat
  terlambat/tidak diketahui;
- `safe` bila tidak ada kondisi di atas.

## Normalisasi Payload

Payload device bisa punya variasi nama field.

Normalizer bertugas membuatnya seragam. Aturan pentingnya:

- tinggi bahan bakar, volume, dan persen isi **dari perangkat dipakai bila dikirim**; bila tidak,
  server menghitungnya sendiri dari jarak sensor dan config tangki. Sumber tiap angka dicatat di
  `quality` (`device` atau `backend`);
- bila nilai dari perangkat berbeda lebih dari 5% kapasitas dari hitungan server, ditambahkan
  peringatan di `warnings`;
- jarak kosong dibaca 0 cm (perilaku yang dicatat apa adanya), jarak negatif dikunci ke 0, dan jarak
  di atas tinggi maksimum dikunci ke tinggi maksimum;
- tegangan di luar rentang wajar dan RSSI di luar `-120…0` dBm diabaikan dengan peringatan.

Contoh mapping (nama lain yang juga diterima ditulis dalam kurung):

| Payload masuk                                                 | Field internal          |
| ------------------------------------------------------------- | ----------------------- |
| `distance_cm` (`dist_cm`, `dist`, `distance`, juga di `raw.`) | `sensorDistanceCm`      |
| `raw.H_cm`                                                    | `fuelHeightCm`          |
| `raw.volume`                                                  | `volumeLiter`           |
| `raw.percent`                                                 | `fillPercent`           |
| `rssi` (`wifi_rssi`, juga di `raw.`)                          | `rssiDbm`               |
| `voltage` (`vbatt`, `vbat`, `batteryVolt`, juga di `raw.`)    | `batteryVolt`           |
| `raw.local_H_cm`                                              | `fuelHeightCm`          |
| `raw.local_volume_l`                                          | `volumeLiter`           |
| `raw.local_percent`                                           | `fillPercent`           |
| `tank_shape`                                                  | snapshot config payload |
| `capacity_liter`                                              | snapshot config payload |
| `consumption_liter_per_hour`                                  | snapshot config payload |

Kode normalizer:

```text
src/features/monitoring/domain/normalize-reading.ts
```

## Kenapa Perlu Test

Angka volume, runtime, dan status memengaruhi keputusan operasional.

Karena itu logika domain harus diuji.

Test berada di:

```text
src/features/monitoring/tests
```

Jalankan:

```powershell
pnpm test
```
