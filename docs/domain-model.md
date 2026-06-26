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
expectedReportIntervalSec = 300
```

Artinya device diharapkan mengirim setiap 5 menit.

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
