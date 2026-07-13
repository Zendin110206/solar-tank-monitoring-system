# Model Domain dan Perhitungan

Dokumen ini menjelaskan rumus dan status yang menjadi inti sistem monitoring.

## Konsep Utama

Sensor biasanya membaca jarak dari sensor ke permukaan cairan.

Data yang ingin dilihat pengguna adalah liter, persen, dan runtime.

Karena itu perlu konversi:

```text
distance -> fuel height -> volume -> percent -> runtime -> status
```

## Tinggi Bahan Bakar

Jika sensor dipasang di atas tangki:

```text
fuelHeightCm = sensorMountHeightCm - sensorDistanceCm
```

Contoh:

```text
sensorMountHeightCm = 150
sensorDistanceCm = 40.5
fuelHeightCm = 109.5
```

Nilai harus dibatasi agar tidak kurang dari 0 dan tidak melebihi tinggi maksimum tangki.

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
src/features/monitoring/lib/tank-volume.ts
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

Payload real-format dapat membawa config rectangular dari device. Sistem tetap membandingkan config itu dengan registry agar perbedaan besar tidak tersembunyi.

## Persentase Isi

```text
fillPercent = volumeLiter / capacityLiter * 100
```

Contoh:

```text
volumeLiter = 3650
capacityLiter = 5000
fillPercent = 73
```

## Runtime

Runtime adalah estimasi berapa jam bahan bakar cukup jika konsumsi per jam sesuai asumsi.

```text
runtimeHour = volumeLiter / consumptionLiterPerHour
```

Contoh:

```text
volumeLiter = 3650
consumptionLiterPerHour = 25
runtimeHour = 146
```

Kode runtime berada di:

```text
src/features/monitoring/lib/runtime.ts
```

## Status Runtime

Aturan awal:

| Runtime | Status |
|---:|---|
| `< 13 jam` | Kritis |
| `13 - < 16 jam` | Waspada |
| `16 - 24 jam` | Aman terbatas |
| `> 24 jam` | Aman panjang |

Aturan ini bisa berubah setelah ada validasi operasional.

## Status Device

Device dinilai dari umur data terakhir dibanding interval kirim yang diharapkan.

Contoh:

```text
expectedReportIntervalSec = 20
```

Artinya device diharapkan mengirim setiap 20 detik. Nilai ini berasal dari
registry/profile perangkat dan dapat berbeda untuk perangkat demo atau mode
hemat bandwidth. Status online/delayed/offline selalu memakai nilai device
terdaftar, bukan angka yang di-hardcode di UI.

Jika data terakhir terlalu lama, status bisa menjadi delayed atau offline.

## Normalisasi Payload

Payload device bisa punya variasi nama field.

Normalizer bertugas membuatnya seragam.

Contoh mapping:

| Payload masuk | Field internal |
|---|---|
| `distance` | `sensorDistanceCm` |
| `raw.H_cm` | `fuelHeightCm` |
| `raw.volume` | `volumeLiter` |
| `raw.percent` | `fillPercent` |
| `raw.wifi_rssi` | `rssiDbm` |
| `voltage` | `batteryVolt` |
| `raw.local_H_cm` | `fuelHeightCm` |
| `raw.local_volume_l` | `volumeLiter` |
| `raw.local_percent` | `fillPercent` |
| `tank_shape` | snapshot config payload |
| `capacity_liter` | snapshot config payload |
| `consumption_liter_per_hour` | snapshot config payload |

Kode normalizer:

```text
src/features/monitoring/lib/normalize-reading.ts
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
