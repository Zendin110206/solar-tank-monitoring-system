# Ingest Data Device

Dokumen ini menjelaskan cara data dari device atau simulator masuk ke aplikasi.

## Konsep Dasar

Device tidak mengirim liter secara ajaib. Biasanya sensor membaca jarak.

Alur data:

```text
jarak sensor
  -> tinggi bahan bakar
  -> volume liter
  -> persen isi
  -> runtime
  -> status
```

Pada fase prototipe, simulator bisa langsung mengirim `raw.volume` dan `raw.percent` agar alur API mudah diuji. Untuk pilot, device atau smoke test dapat mengirim payload real-format yang membawa config tangki seperti bentuk, kapasitas, dimensi, dan konsumsi per jam.

## Endpoint

```http
POST /api/ingest
```

## Header

Header wajib:

```http
Content-Type: application/json
X-Device-Id: demo-tph-01
X-Api-Key: demo-tph-key
```

Alternatif:

```http
X-Device-Key: demo-tph-key
```

Key demo yang tersedia:

| Device | Key demo |
|---|---|
| `demo-tph-01` | `demo-tph-key` |
| `demo-nja-01` | `demo-nja-key` |
| `demo-jto-01` | `demo-jto-key` |
| `demo-skp-01` | `demo-skp-key` |

Fallback `local-development-key` masih bisa dipakai untuk latihan awal jika `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK` tidak dimatikan. Untuk mode yang lebih dekat pilot, gunakan key per device dan set fallback global ke `false`.

## Payload yang Didukung

Payload CAT-like:

```json
{
  "device": "demo-tph-01",
  "ts": 0,
  "distance": 40.5,
  "voltage": 3.86,
  "raw": {
    "H_cm": 109.5,
    "volume": 3650,
    "percent": 73,
    "wifi_rssi": -55
  }
}
```

Penjelasan:

| Field | Arti |
|---|---|
| `device` | kode device |
| `ts` | timestamp dari device, boleh `0` untuk fallback waktu server |
| `distance` | jarak sensor ke permukaan cairan |
| `voltage` | tegangan device |
| `raw.H_cm` | tinggi cairan |
| `raw.volume` | volume liter |
| `raw.percent` | persen isi |
| `raw.wifi_rssi` | sinyal WiFi |

Catatan timestamp:

- Kirim `measuredAt`/`ts_iso` dalam format ISO UTC jika firmware sudah punya waktu yang benar.
- Jika hanya punya Unix timestamp, kirim `ts` dalam detik atau milidetik.
- Jika waktu device belum dipercaya, kirim `ts: 0`; server akan memakai waktu terima.
- Dashboard menampilkan jam operasional dalam WIB, tetapi data API tetap disimpan sebagai UTC agar konsisten antara lokal, Vercel, dan server kantor.

Payload real-format untuk pilot:

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

API tetap memakai registry sebagai identitas resmi site/tangki/device. Config dari payload dibaca sebagai snapshot. Jika snapshot payload berbeda jauh dari registry, response ingest membawa `needsReview=true` dan dashboard/detail menampilkan status review.

Untuk fase pilot peta, posisi marker peta dashboard tetap berasal dari `latitude` dan
`longitude` pada registry site. Payload device boleh membawa `lat`/`lng` jika
suatu saat tersedia, tetapi nilai itu belum dipakai untuk memindahkan titik STO.
Alasannya, perangkat saat ini tidak memakai modul GPS dan lokasi STO harus
diisi manual berdasarkan data yang sudah disetujui.

## Validasi yang Dilakukan

API mengecek:

- header `X-Device-Id` ada;
- key ada;
- payload berupa JSON object;
- device terdaftar;
- device aktif;
- key cocok dengan hash key device atau fallback development yang masih diizinkan;
- device di payload tidak bertentangan dengan header;
- tangki untuk device ditemukan.
- config payload tidak dipakai diam-diam tanpa review jika berbeda jauh dari registry.

Jika semua lolos, payload dinormalisasi dan disimpan ke storage aktif. Default development memakai memory store. Mode MySQL dapat diaktifkan lewat `SOLAR_TANK_STORAGE_DRIVER="mysql"`.

## Simulator

Jalankan dev server:

```powershell
pnpm dev
```

Kirim satu data:

```powershell
pnpm simulate:device --once
```

Kirim kondisi kritis:

```powershell
pnpm simulate:device --critical --once
```

Kirim device tertentu:

```powershell
pnpm simulate:device --device demo-nja-01 --once
```

## Smoke Test Pilot

Untuk menguji payload real-format tanpa menunggu device fisik:

```powershell
$env:PILOT_API_BASE_URL="https://solar-tank-monitoring-system.vercel.app"
$env:PILOT_DEVICE_ID="pilot-tph-01"
$env:PILOT_DEVICE_KEY="key-asli-device"
pnpm pilot:smoke
```

Jika ingin melihat payload tanpa mengirim:

```powershell
pnpm pilot:smoke -- --dry-run
```

Jika smoke test gagal:

| Status | Arti |
|---|---|
| `401` | key salah atau hash di registry tidak cocok |
| `404` | device belum ada di registry aktif |
| `503` | storage MySQL belum siap |
| `needsReview=true` | payload masuk, tetapi config payload berbeda dari registry |

## Device Dummy yang Tersedia

| Device | Tangki |
|---|---|
| `demo-tph-01` | `tank-tph-main` |
| `demo-nja-01` | `tank-nja-main` |
| `demo-jto-01` | `tank-jto-main` |
| `demo-skp-01` | `tank-skp-main` |

## Hal yang Belum Final

Sebelum perangkat nyata dipakai, perlu dikunci:

- interval kirim device;
- format payload firmware;
- key per device;
- dimensi tangki;
- posisi sensor;
- metode kalibrasi;
- apakah hitung volume dilakukan di device atau server;
- jaringan dan target deployment.
- cara rotasi key jika device diganti atau key bocor.

## Catatan Keamanan

Jangan menaruh key production di kode.

Untuk production nanti:

- jangan gunakan fallback global;
- simpan hash key per device di database;
- gunakan HTTPS;
- beri rate limit;
- catat audit log;
- rotasi key jika device hilang atau bocor.
