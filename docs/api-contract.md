# Kontrak API

> **Status dokumen:** dicocokkan dengan kode dan balasan API lokal pada 28 Oktober 2026.

Dokumen ini menjelaskan endpoint yang tersedia dan bentuk data yang diharapkan.

Base URL lokal:

```text
http://localhost:3000
```

## Ringkasan Endpoint

Kolom "Akses": **publik** (tanpa sesi), **sesi** (user atau admin yang login), **admin**,
**perangkat** (kunci perangkat), **token** (token sekali pakai di alamat).

| Method        | Endpoint                              | Akses     | Fungsi                                          |
| ------------- | ------------------------------------- | --------- | ----------------------------------------------- |
| `GET`         | `/api/health`                         | publik    | Mengecek aplikasi hidup tanpa mengecek database |
| `GET`         | `/api/ready`                          | admin     | Mengecek kesiapan storage dan konfigurasi       |
| `GET`         | `/api/dashboard/overview`             | sesi      | Ringkasan semua lokasi/tangki                   |
| `GET`         | `/api/tanks/[tankId]`                 | sesi      | Detail satu tangki                              |
| `GET`         | `/api/tanks/[tankId]/readings`        | sesi      | Riwayat pembacaan satu tangki                   |
| `GET`         | `/api/tanks/[tankId]/readings/export` | sesi      | Download CSV reading satu tangki                |
| `POST`        | `/api/ingest`                         | perangkat | Menerima data device atau simulator             |
| `GET`         | `/api/device-packages/download`       | token     | Mengunduh paket firmware (ZIP) dari email       |
| `POST`        | `/api/helpdesk/session`               | publik    | Membuka atau melanjutkan sesi helpdesk          |
| `GET`, `POST` | `/api/helpdesk/messages`              | publik    | Membaca dan mengirim pesan helpdesk             |

Endpoint auth (semua di bawah `/api/auth/`):

| Method | Endpoint                              | Akses    | Fungsi                                      |
| ------ | ------------------------------------- | -------- | ------------------------------------------- |
| `POST` | `/api/auth/login`                     | publik   | Login dengan email/username dan password    |
| `POST` | `/api/auth/login/verify-otp`          | publik   | Verifikasi OTP login admin                  |
| `POST` | `/api/auth/logout`                    | publik   | Keluar dan mencabut session aktif           |
| `GET`  | `/api/auth/me`                        | sesi     | Membaca user session aktif                  |
| `POST` | `/api/auth/register-request`          | publik   | Mengajukan akses pengguna baru              |
| `GET`  | `/api/auth/email/verify`              | token    | Verifikasi email dari link token            |
| `POST` | `/api/auth/email/resend-verification` | publik   | Kirim ulang email verifikasi                |
| `POST` | `/api/auth/password/forgot`           | publik   | Meminta link reset kata sandi               |
| `POST` | `/api/auth/password/reset`            | token    | Mengganti kata sandi memakai token reset    |
| `POST` | `/api/auth/password/change`           | sesi     | Mengganti kata sandi user yang sedang login |
| `GET`  | `/api/auth/sessions`                  | sesi     | Melihat sesi aktif milik user               |
| `POST` | `/api/auth/sessions/revoke`           | sesi     | Mencabut sesi lain milik user               |
| `POST` | `/api/auth/telegram/bind/start`       | sesi     | Membuat token binding Telegram              |
| `POST` | `/api/auth/telegram/webhook`          | Telegram | Webhook Telegram untuk binding              |

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
    "timestamp": "2026-07-08T00:00:00.000Z"
  }
}
```

## GET /api/ready

Fungsi:

```text
Mengecek apakah storage aktif dan konfigurasi penting siap dipakai.
```

Endpoint ini berisi detail operasional, jadi aksesnya dibatasi:

- dengan token: header `x-solar-tank-readiness-token` atau `Authorization: Bearer <token>` yang
  cocok dengan `READINESS_CHECK_TOKEN`;
- atau dengan sesi **admin**;
- di lingkungan non-produksi yang tidak mengatur `READINESS_CHECK_TOKEN`, endpoint ini terbuka.

Tanpa akses yang sah, balasannya HTTP `401` dengan pesan
`"Readiness operasional hanya tersedia untuk admin."`.

Balasan berisi `ok`, `status` (`ready`, `degraded`, atau `not_ready`), `service`, `timestamp`,
`appEnv`, `nodeEnv`, `storageDriver`, dan daftar `checks`. HTTP `200` bila `ok` bernilai
`true`, HTTP `503` bila ada pemeriksaan yang gagal. Setiap pemeriksaan berisi `name`, `ok`,
`status` (`ok`, `degraded`, `error`), `message`, dan kadang `latencyMs`.

Pemeriksaan yang ada (per Oktober 2026): `mysql` (atau `memory-storage` bila memakai storage
memory), `auth-secret`, `app-base-url`, `admin-otp`, `auth-email-flow`, `auth-captcha`,
`auth-telegram`, `device-key-policy`, `device-auto-provisioning`, `device-package-encryption`,
`database-backup`, `mysql-reference-registry`, `mysql-reading-rollup`, `mysql-auth-telegram`,
dan `mysql-location-taxonomy`.

Contoh (dipotong):

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
        "message": "Koneksi MySQL aktif.",
        "latencyMs": 3
      }
    ]
  }
}
```

Bila koneksi MySQL gagal, pemeriksaan `mysql` berisi pesan "Koneksi MySQL gagal. Cek
MYSQL_DATABASE_URL, status database, SSL, network, dan allowlist provider." dan balasannya
HTTP `503`.

## GET /api/dashboard/overview

Fungsi:

```text
Mengambil ringkasan dashboard. Wajib sesi user atau admin; tanpa sesi balasannya HTTP `401`
(`"Autentikasi diperlukan."`).
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
    "generatedAt": "2026-10-28T10:24:05.000Z",
    "summary": {
      "totalSites": 10,
      "totalTanks": 10,
      "criticalTanks": 0,
      "warningTanks": 2,
      "onlineDevices": 0,
      "delayedDevices": 2,
      "offlineDevices": 8,
      "averageIntervalLabel": "2 mnt",
      "syncLabel": "Sinkron 16 mnt lalu"
    },
    "rows": [],
    "priorityRows": [],
    "latestRow": null,
    "healthCards": [],
    "healthSegments": [],
    "trendBars": []
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
Field data berisi isi dashboard. Field meta.storage membantu melihat apakah reading sedang dibaca dari MySQL atau memory lokal. Jika mode MySQL aktif tetapi tabel reading masih kosong, API tetap memakai MySQL dan mengembalikan daftar reading kosong; dashboard akan menampilkan STO dari registry dengan status belum ada data. Field meta.registry membantu melihat apakah referensi site/tangki/device sedang dibaca dari memory lokal atau MySQL. Pada MySQL, overview membandingkan snapshot live dengan kandidat history terbaru lalu memilih `receivedAt` paling baru agar status konsisten selama transisi deployment.
```

## GET /api/tanks/[tankId]

Fungsi:

```text
Mengambil detail satu tangki. Wajib sesi user atau admin.
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

Catatan:

- `measuredAt` dan `receivedAt` adalah ISO UTC.
- UI boleh menampilkan label WIB, tetapi API tetap mengirim waktu standar UTC.
- Endpoint ini membaca history tank terkait, bukan daftar global dashboard.
- Wajib sesi user atau admin. Bila tangki tidak punya riwayat, balasannya HTTP `404`
  (`"Riwayat tangki tidak ditemukan."`).
- Parameter `range` (bawaan `24h`) saat ini hanya dikembalikan apa adanya di balasan dan
  **tidak** menyaring data.
- Setelah migration rollup, item history baru mewakili bucket 5 menit dan dapat membawa `resolution`, `bucketStart`, `bucketEnd`, `sampleCount`, nilai mean, min, dan max.

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
        "measuredAt": "2026-10-25T04:54:33.000Z",
        "receivedAt": "2026-10-25T04:54:33.502Z",
        "timeLabel": "11.54",
        "sensorDistanceCm": 24,
        "fuelHeightCm": 126,
        "volumeLiter": 4200,
        "fillPercent": 84,
        "runtimeHour": 168,
        "status": "received"
      }
    ]
  }
}
```

## GET /api/tanks/[tankId]/readings/export

Fungsi:

```text
Mengunduh CSV reading satu tangki sesuai periode yang dipilih.
```

Endpoint ini wajib memakai session user/admin aktif (tanpa sesi: HTTP `401`). Data CSV memakai header
bahasa Indonesia, menyertakan waktu UTC dan WIB, dan nama file otomatis memuat
site, tangki, rentang, serta tanggal periode.

CSV juga menyertakan resolusi reading, batas bucket, jumlah sampel, mean pada
kolom nilai utama, serta min/max volume dan persentase. Raw history lama tetap
dapat diekspor berdampingan dengan row rollup.

Query:

| Parameter | Nilai                  | Default | Keterangan                                                 |
| --------- | ---------------------- | ------- | ---------------------------------------------------------- |
| `range`   | `day`, `week`, `month` | `day`   | Periode 1 hari, 7 hari, atau 30 hari berbasis kalender WIB |

Alias yang juga diterima:

- `1d` dan `24h` untuk `day`;
- `7d` untuk `week`;
- `30d` untuk `month`.

Contoh:

```powershell
curl.exe -L "http://localhost:3000/api/tanks/tank-tph-main/readings/export?range=week"
```

Contoh nama file:

```text
solartank_contoh-a_tangki-utama_reading_7-hari_2026-07-01_sampai_2026-07-07.csv
```

Jika `range` tidak dikenal:

```json
{
  "ok": false,
  "error": "Range export tidak dikenal. Gunakan day, week, atau month."
}
```

## POST /api/ingest

Fungsi:

```text
Menerima payload dari device, simulator, atau smoke test pilot.
```

Pada storage MySQL, satu request yang valid memperbarui snapshot live dan
agregat 5 menit dalam satu transaksi. Response sukses hanya dikirim setelah
kedua operasi berhasil di-commit.

Header wajib:

```http
Content-Type: application/json
X-Device-Id: demo-tph-01
X-Api-Key: demo-tph-key
```

`X-Device-Key` juga diterima sebagai alternatif `X-Api-Key`.

Catatan key:

- setiap device contoh memiliki key development sendiri;
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
  "device": "pilot-contoh-a-01",
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

Regional, Wilayah, dan Area tidak dikirim pada setiap reading. Data tersebut
berasal dari registry site yang sudah disetujui, lalu digabungkan oleh server
berdasarkan identitas device. Dengan demikian, satu salah ketik pada firmware
tidak memindahkan STO ke kelompok lokasi yang berbeda.

Contoh curl:

```powershell
curl.exe -X POST http://localhost:3000/api/ingest `
  -H "Content-Type: application/json" `
  -H "X-Device-Id: demo-tph-01" `
  -H "X-Api-Key: demo-tph-key" `
  -d "{\"device\":\"demo-tph-01\",\"ts\":0,\"distance\":40.5,\"voltage\":3.86,\"raw\":{\"H_cm\":109.5,\"volume\":3650,\"percent\":73,\"wifi_rssi\":-55}}"
```

Response sukses (HTTP `201`):

```json
{
  "ok": true,
  "data": {
    "readingId": "reading-device-jto-main-1793183045269",
    "deviceId": "demo-jto-01",
    "deviceInternalId": "device-jto-main",
    "tankId": "tank-jto-main",
    "receivedAt": "2026-10-28T10:24:05.269Z",
    "measuredAt": "2026-10-28T10:24:05.269Z",
    "sensorDistanceCm": 40,
    "fuelHeightCm": 110,
    "volumeLiter": 3930.42,
    "fillPercent": 78.61,
    "runtimeHour": 157.22,
    "batteryVolt": null,
    "rssiDbm": -60,
    "configStatus": "normal",
    "needsReview": false,
    "warnings": [],
    "storage": "mysql",
    "provisioned": false,
    "activated": false
  }
}
```

`provisioned` bernilai `true` bila kiriman ini membuat perangkat baru secara otomatis, dan
`activated` bernilai `true` bila kiriman ini mengaktifkan perangkat hasil pengajuan (kiriman
valid pertama).

Nilai `storage` bisa berisi:

| Nilai    | Arti                                                   |
| -------- | ------------------------------------------------------ |
| `memory` | Reading disimpan sementara di memory store development |
| `mysql`  | Reading disimpan ke MySQL sesuai `MYSQL_DATABASE_URL`  |

Nilai `configStatus` membantu melihat apakah config payload cocok dengan registry:

| Nilai                     | Arti                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `normal`                  | Payload tidak membawa config tangki, atau config-nya cocok dengan registry                   |
| `minor_config_difference` | Ada beda kecil; config payload tetap boleh dipakai                                           |
| `config_mismatch`         | Ada beda besar; server memakai config registry dan `needsReview` bernilai `true`             |
| `invalid_config`          | Config payload tidak valid; server memakai config registry dan `needsReview` bernilai `true` |

Nilai `needs_review` ada di tipe data, tetapi saat ini tidak pernah dihasilkan server.

## Error yang Mungkin Muncul

| Status | Penyebab                                                                                  |
| ------ | ----------------------------------------------------------------------------------------- |
| `400`  | `X-Device-Id` kosong, body bukan JSON valid/bukan object, atau identitas payload ≠ header |
| `401`  | Kunci perangkat kosong atau salah, atau kunci provisioning salah                          |
| `403`  | Perangkat tidak aktif, atau paket/akses perangkat sudah tidak berlaku                     |
| `404`  | Perangkat tidak terdaftar, atau konfigurasi tangki untuk perangkat tidak ditemukan        |
| `405`  | Method selain `POST`                                                                      |
| `429`  | Lebih dari 120 kiriman per menit per perangkat dan alamat (hanya storage MySQL)           |
| `500`  | Gagal menyimpan data ke storage aktif, atau gagal membuat perangkat otomatis              |

Contoh response error:

```json
{
  "ok": false,
  "error": "Device key tidak valid."
}
```

## GET /api/device-packages/download

Mengunduh paket firmware (ZIP) memakai token dari email "Firmware FTM siap":

```text
/api/device-packages/download?token=<token>
```

- Hanya berjalan dengan storage MySQL (memory: HTTP `503`).
- Sukses: HTTP `200`, `Content-Type: application/zip`, `Cache-Control: no-store`, dan
  `X-Content-Type-Options: nosniff`.
- Gagal (balasan `{ "error": "..." }`): `400` token tidak valid, `404` paket tidak ditemukan,
  `410` tautan sudah tidak berlaku atau kedaluwarsa, `429` batas unduh habis, `500` paket
  belum bisa dibuka.

## Helpdesk

- `POST /api/helpdesk/session` membuka atau melanjutkan sesi helpdesk dari widget bantuan.
- `GET /api/helpdesk/messages` membaca pesan sesi; `POST /api/helpdesk/messages` mengirim
  pesan baru. Token sesi dikirim dari widget; tanpa token balasannya HTTP `400`.
- Ketiganya publik. Pembukaan sesi dan pengiriman pesan dibatasi jumlah permintaannya per
  alamat (HTTP `429` bila terlampaui).

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
- login admin membalas `{ "requiresOtp": true }` bila OTP admin aktif; kode OTP dikirim
  lewat email lalu diverifikasi di `/api/auth/login/verify-otp`;
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
  -d "{\"fullName\":\"Operator Monitoring\",\"username\":\"operator_1\",\"email\":\"operator@example.com\",\"phone\":\"081234567890\",\"password\":\"Password12345\",\"confirmPassword\":\"Password12345\",\"requestedRole\":\"user\",\"accessReason\":\"Perlu memantau STO area contoh\",\"captchaToken\":\"token-turnstile\"}"
```

## Catatan Versi

Kontrak API ini dipakai untuk development dan pilot web monitoring. Ia belum
menjadi kontrak permanen untuk seluruh perangkat nasional.

Sebelum production, perlu ditambah atau dimatangkan:

- halaman manajemen registry site/tank/device;
- aturan versi API sebelum banyak model perangkat dipasang;
- perlindungan jaringan tambahan di luar rate limit aplikasi;
- rotasi key device;
- latihan restore database secara rutin;
- SMTP dan Turnstile production;
- versioning API jika device sudah banyak.
