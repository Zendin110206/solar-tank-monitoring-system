# Kontrak API

Dokumen ini menjelaskan endpoint yang tersedia dan bentuk data yang diharapkan.

Base URL lokal:

```text
http://localhost:3000
```

## Ringkasan Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/health` | Mengecek aplikasi hidup tanpa mengecek database |
| `GET` | `/api/ready` | Mengecek kesiapan storage aktif |
| `GET` | `/api/dashboard/overview` | Ringkasan semua lokasi/tangki |
| `GET` | `/api/tanks/[tankId]` | Detail satu tangki |
| `GET` | `/api/tanks/[tankId]/readings` | Riwayat pembacaan satu tangki |
| `POST` | `/api/ingest` | Menerima data device atau simulator |

## GET /api/health

Fungsi:

```text
Mengecek apakah aplikasi Next.js hidup.
```

Endpoint ini tidak mengecek database. Gunakan endpoint ini untuk membedakan
apakah masalah ada di aplikasi atau di storage.

Contoh:

```powershell
curl.exe http://localhost:3000/api/health
```

Response sukses:

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "service": "solar-tank-monitoring-system",
    "storageDriver": "mysql"
  }
}
```

## GET /api/ready

Fungsi:

```text
Mengecek apakah storage aktif siap dipakai dashboard dan API baca.
```

Jika `SOLAR_TANK_STORAGE_DRIVER="memory"`, endpoint ini tetap sukses tetapi
statusnya `degraded` karena data memory tidak permanen.

Jika `SOLAR_TANK_STORAGE_DRIVER="mysql"`, endpoint ini mengetes koneksi MySQL
langsung. Jika MySQL gagal, response memakai HTTP `503`.

Contoh:

```powershell
curl.exe http://localhost:3000/api/ready
```

Response MySQL siap:

```json
{
  "ok": true,
  "data": {
    "ok": true,
    "status": "ready",
    "storageDriver": "mysql",
    "checks": [
      {
        "name": "mysql",
        "ok": true,
        "status": "ok",
        "message": "Koneksi MySQL aktif."
      },
      {
        "name": "mysql-reference-registry",
        "ok": true,
        "status": "ok",
        "message": "Registry MySQL berisi site, tangki, dan device aktif."
      }
    ]
  }
}
```

Response MySQL belum siap:

```json
{
  "ok": false,
  "data": {
    "ok": false,
    "status": "not_ready",
    "storageDriver": "mysql",
    "checks": [
      {
        "name": "mysql",
        "ok": false,
        "status": "error",
        "message": "Koneksi MySQL gagal. Cek MYSQL_DATABASE_URL, status database, SSL, network, dan allowlist provider."
      }
    ]
  }
}
```

Catatan:

```text
Jika baru mengubah .env.local, restart dev server. Tombol retry di dashboard tidak memuat ulang env.
```

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
    },
    "registry": {
      "configuredDriver": "mysql",
      "activeDriver": "mysql",
      "isFallback": false,
      "label": "Registry MySQL"
    }
  }
}
```

Catatan:

```text
Field data berisi isi dashboard. Field meta.storage membantu melihat apakah reading sedang dibaca dari MySQL atau memory lokal. Jika mode MySQL aktif tetapi tabel reading masih kosong, API tetap memakai MySQL dan mengembalikan daftar reading kosong; dashboard akan menampilkan STO dari registry dengan status belum ada data. Field meta.registry membantu melihat apakah referensi site/tangki/device sedang dibaca dari memory lokal atau MySQL.
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
| `503` | Storage aktif belum siap, terutama MySQL belum bisa dikoneksi |

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
- halaman manajemen registry site/tank/device;
- validasi schema lebih ketat;
- audit log;
- rotasi key device;
- versioning API jika device sudah banyak.
