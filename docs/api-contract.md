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
| `POST` | `/api/auth/login` | Login dengan email/username dan password |
| `POST` | `/api/auth/login/verify-otp` | Verifikasi OTP login admin |
| `POST` | `/api/auth/logout` | Keluar dan mencabut session aktif |
| `GET` | `/api/auth/me` | Membaca user session aktif |
| `POST` | `/api/auth/register-request` | Mengajukan akses pengguna baru |
| `GET` | `/api/auth/email/verify` | Verifikasi email dari link token |
| `POST` | `/api/auth/email/resend-verification` | Kirim ulang email verifikasi |
| `POST` | `/api/auth/password/forgot` | Meminta link reset kata sandi |
| `POST` | `/api/auth/password/reset` | Mengganti kata sandi memakai token reset |
| `POST` | `/api/auth/password/change` | Mengganti kata sandi user yang sedang login |
| `GET` | `/api/auth/sessions` | Melihat sesi aktif milik user |
| `POST` | `/api/auth/sessions/revoke` | Mencabut sesi lain milik user |
| `POST` | `/api/auth/telegram/bind/start` | Membuat token binding Telegram |
| `POST` | `/api/auth/telegram/webhook` | Webhook Telegram untuk binding |

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
Menerima payload dari device, simulator, atau smoke test pilot.
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

Payload pilot real-format juga didukung. Payload ini dapat membawa config tangki dari device:

```json
{
  "device": "pilot-tph-01",
  "tank_shape": "rectangular",
  "capacity_liter": 540,
  "length_cm": 150,
  "width_cm": 60,
  "height_cm": 60,
  "sensor_mount_height_cm": 60,
  "consumption_liter_per_hour": 25,
  "distance": 10.2,
  "voltage": 3.7,
  "raw": {
    "local_H_cm": 49.8,
    "local_volume_l": 448.2,
    "local_percent": 83,
    "wifi_rssi": -54
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
    "storage": "memory",
    "configStatus": "no_payload_config",
    "needsReview": false,
    "warnings": []
  }
}
```

Nilai `storage` bisa berisi:

| Nilai | Arti |
|---|---|
| `memory` | Reading disimpan sementara di memory store development |
| `mysql` | Reading disimpan ke MySQL sesuai `MYSQL_DATABASE_URL` |

Nilai `configStatus` membantu melihat apakah config payload cocok dengan registry:

| Nilai | Arti |
|---|---|
| `no_payload_config` | Payload tidak membawa config tangki |
| `config_match` | Config payload dan registry cocok |
| `config_minor_difference` | Ada beda kecil yang perlu diketahui |
| `config_mismatch` | Ada beda besar dan perlu review |
| `invalid_payload_config` | Config payload tidak valid |

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

## Endpoint Auth

Endpoint auth memakai response JSON umum:

```json
{
  "ok": true,
  "data": {}
}
```

Jika gagal:

```json
{
  "ok": false,
  "error": "Pesan error"
}
```

Catatan keamanan auth:

- `/api/auth/register-request`, `/api/auth/password/forgot`, dan
  `/api/auth/email/resend-verification` dapat dilindungi Turnstile jika
  `AUTH_CAPTCHA_PROVIDER="turnstile"`;
- token verifikasi keamanan dikirim sebagai `captchaToken`;
- login admin dapat mengembalikan status `otp_required` jika OTP admin aktif;
- session dikirim sebagai cookie `httpOnly`;
- halaman admin tetap divalidasi server-side memakai role admin, bukan hanya
  disembunyikan dari UI;
- reset password, verifikasi email, dan Telegram binding memakai token sekali
  pakai yang disimpan sebagai hash di database.

Contoh login:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"identity\":\"admin@example.com\",\"password\":\"Password12345\"}"
```

Contoh pengajuan akses:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register-request `
  -H "Content-Type: application/json" `
  -d "{\"fullName\":\"Operator Monitoring\",\"username\":\"operator_1\",\"email\":\"operator@example.com\",\"phone\":\"081234567890\",\"password\":\"Password12345\",\"confirmPassword\":\"Password12345\",\"requestedRole\":\"user\",\"accessReason\":\"Perlu memantau STO area Pasuruan\",\"captchaToken\":\"token-turnstile\"}"
```

## Catatan Versi

Kontrak API ini masih untuk prototipe lokal.

Sebelum production, perlu ditambah atau dimatangkan:

- halaman manajemen registry site/tank/device;
- validasi schema lebih ketat;
- rate limit endpoint ingest;
- rotasi key device;
- backup/restore database;
- SMTP dan Turnstile production;
- versioning API jika device sudah banyak.
