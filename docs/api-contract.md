# Kontrak API

Dokumen ini menjelaskan endpoint yang tersedia dan bentuk data yang diharapkan.

Base URL lokal:

```text
http://localhost:3000
```

## Ringkasan Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/dashboard/overview` | Ringkasan semua lokasi/tangki |
| `GET` | `/api/tanks/[tankId]` | Detail satu tangki |
| `GET` | `/api/tanks/[tankId]/readings` | Riwayat pembacaan satu tangki |
| `POST` | `/api/ingest` | Menerima data device atau simulator |

## GET /api/dashboard/overview

Fungsi:

```text
Mengambil ringkasan dashboard.
```

Contoh:

```powershell
curl.exe http://localhost:3000/api/dashboard/overview
```

Response sukses:

```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalSites": 4,
      "totalTanks": 4,
      "onlineDevices": 1,
      "delayedDevices": 0,
      "offlineDevices": 3,
      "criticalTanks": 1
    },
    "rows": []
  },
  "meta": {
    "storage": {
      "configuredDriver": "mysql",
      "activeDriver": "mysql",
      "isFallback": false,
      "label": "Database MySQL"
    }
  }
}
```

Catatan:

```text
Field data berisi isi dashboard. Field meta.storage membantu melihat apakah data sedang dibaca dari MySQL, memory lokal, atau fallback memory karena MySQL kosong.
```

## GET /api/tanks/[tankId]

Fungsi:

```text
Mengambil detail satu tangki.
```

Contoh:

```powershell
curl.exe http://localhost:3000/api/tanks/tank-tph-main
```

Response sukses berisi:

- identitas tangki;
- lokasi;
- status;
- volume liter;
- persen isi;
- runtime;
- parameter sensor;
- data terakhir;
- riwayat ringkas;
- titik lokasi contoh.

Jika `tankId` tidak ditemukan:

```json
{
  "ok": false,
  "error": "Tangki tidak ditemukan."
}
```

## GET /api/tanks/[tankId]/readings

Fungsi:

```text
Mengambil riwayat pembacaan satu tangki.
```

Contoh:

```powershell
curl.exe "http://localhost:3000/api/tanks/tank-tph-main/readings?range=24h"
```

Response sukses:

```json
{
  "ok": true,
  "data": {
    "tankId": "tank-tph-main",
    "range": "24h",
    "items": [
      {
        "measuredAt": "2026-06-25T07:40:00.000Z",
        "receivedAt": "2026-06-25T07:40:03.000Z",
        "volumeLiter": 3900,
        "fillPercent": 78,
        "runtimeHour": 156
      }
    ]
  }
}
```

## POST /api/ingest

Fungsi:

```text
Menerima payload dari device atau simulator.
```

Header wajib:

```http
Content-Type: application/json
X-Device-Id: demo-tph-01
X-Api-Key: demo-tph-key
```

`X-Device-Key` juga diterima sebagai alternatif `X-Api-Key`.

Catatan key:

- setiap device dummy memiliki key demo sendiri;
- fallback `local-development-key` hanya untuk development lokal;
- untuk mode yang lebih dekat pilot, set `SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"`.

Payload contoh:

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

Contoh curl:

```powershell
curl.exe -X POST http://localhost:3000/api/ingest `
  -H "Content-Type: application/json" `
  -H "X-Device-Id: demo-tph-01" `
  -H "X-Api-Key: demo-tph-key" `
  -d "{\"device\":\"demo-tph-01\",\"ts\":0,\"distance\":40.5,\"voltage\":3.86,\"raw\":{\"H_cm\":109.5,\"volume\":3650,\"percent\":73,\"wifi_rssi\":-55}}"
```

Response sukses:

```json
{
  "ok": true,
  "data": {
    "deviceId": "demo-tph-01",
    "tankId": "tank-tph-main",
    "volumeLiter": 3650,
    "fillPercent": 73,
    "runtimeHour": 146,
    "storage": "memory"
  }
}
```

Nilai `storage` bisa berisi:

| Nilai | Arti |
|---|---|
| `memory` | Reading disimpan sementara di memory store development |
| `mysql` | Reading disimpan ke MySQL sesuai `MYSQL_DATABASE_URL` |

## Error yang Mungkin Muncul

| Status | Penyebab |
|---|---|
| `400` | Body bukan JSON valid atau payload tidak sesuai |
| `401` | Key kosong atau salah |
| `403` | Device tidak aktif |
| `404` | Device atau tangki tidak ditemukan |

Contoh response error:

```json
{
  "ok": false,
  "error": "Device key tidak valid."
}
```

## Catatan Versi

Kontrak API ini masih untuk prototipe lokal.

Sebelum production, perlu ditambah atau dimatangkan:

- autentikasi user;
- rate limit;
- registry site/tank/device dari database;
- validasi schema lebih ketat;
- audit log;
- rotasi key device;
- versioning API jika device sudah banyak.
