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

Pada fase prototipe, simulator bisa langsung mengirim `raw.volume` dan `raw.percent` agar alur API mudah diuji.

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
