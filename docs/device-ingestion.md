# Ingest Data Device

> **Status dokumen:** dicocokkan dengan kode pada 31 Oktober 2026. Kontrak perangkat v1
> (alamat, header, bentuk kiriman, dan balasan) dibekukan dan dikunci tes
> `ingest-route-contract.test.ts`.

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

Pada mode development, simulator bisa langsung mengirim `raw.volume` dan
`raw.percent` agar alur API mudah diuji. Untuk pilot, device atau smoke test
dapat mengirim payload real-format yang membawa config tangki seperti bentuk,
kapasitas, dimensi, dan konsumsi per jam.

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

| Device        | Key demo       |
| ------------- | -------------- |
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

| Field           | Arti                                                                 |
| --------------- | -------------------------------------------------------------------- |
| `device`        | kode device                                                          |
| `ts`            | timestamp dari device, boleh `0` untuk fallback waktu server         |
| `distance`      | tinggi ruang kosong: jarak sensor di atas tangki ke permukaan cairan |
| `voltage`       | tegangan device                                                      |
| `raw.H_cm`      | tinggi cairan                                                        |
| `raw.volume`    | volume liter                                                         |
| `raw.percent`   | persen isi                                                           |
| `raw.wifi_rssi` | sinyal WiFi                                                          |

Catatan timestamp:

- Kirim `measuredAt`/`ts_iso` dalam format ISO UTC jika firmware sudah punya waktu yang benar.
- Jika hanya punya Unix timestamp, kirim `ts` dalam detik atau milidetik.
- Jika waktu device belum dipercaya, kirim `ts: 0`; server akan memakai waktu terima.
- Bila waktu dari perangkat tidak valid atau berselisih lebih dari 24 jam dari waktu server,
  server memakai waktu terima dan menambahkan peringatan di `warnings`.
- Dashboard menampilkan jam operasional dalam WIB, tetapi data API tetap disimpan sebagai UTC agar konsisten antara lokal, Vercel, dan server kantor.

Payload real-format untuk pilot:

```json
{
  "device": "pilot-contoh-a-01",
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

Regional, Wilayah, dan Area tidak perlu dikirim berulang kali setiap 20 detik.
Ketiganya disimpan pada registry lokasi, lalu server menggabungkannya dengan
reading berdasarkan device yang mengirim. Cara ini membuat payload perangkat
lebih kecil dan mencegah nama lokasi berubah hanya karena salah isi firmware.

Untuk fase pilot peta, posisi marker peta dashboard tetap berasal dari `latitude` dan
`longitude` pada registry site. Payload device boleh membawa `lat`/`lng` jika
suatu saat tersedia, tetapi nilai itu belum dipakai untuk memindahkan titik STO.
Alasannya, perangkat saat ini tidak memakai modul GPS dan lokasi STO harus
diisi manual berdasarkan data yang sudah disetujui.

## Validasi yang Dilakukan

API mengecek:

- batas jumlah kiriman: lebih dari 120 kiriman per menit per perangkat dan alamat ditolak
  dengan HTTP `429` (hanya saat storage MySQL);
- body berupa JSON valid;
- header `X-Device-Id` ada dan kunci perangkat (`X-Api-Key` atau `X-Device-Key`) ada;
- payload berupa JSON object;
- perangkat terdaftar. Perangkat yang belum terdaftar hanya dibuat otomatis bila pembuatan
  perangkat otomatis diaktifkan dan kunci provisioning cocok;
- perangkat aktif, atau perangkat hasil pengajuan yang sedang menunggu kiriman valid pertama
  (kiriman itu mengaktifkannya);
- kunci cocok dengan hash kunci perangkat, atau dengan kunci cadangan development yang masih
  diizinkan;
- identitas perangkat di payload tidak bertentangan dengan header;
- tangki untuk perangkat ditemukan;
- config payload tidak dipakai diam-diam bila berbeda jauh dari registry.

Kode status tiap kegagalan ada di [kontrak API](api-contract.md#post-apiingest).

Perilaku yang dicatat apa adanya: kiriman tanpa jarak (`distance`/`distance_cm`) tetap
diterima dan jaraknya dibaca **0 cm**, sehingga tangki terbaca penuh. Peringatan dicatat di
`warnings`, tetapi kiriman tidak ditolak.

Jika semua lolos, payload dinormalisasi dan disimpan ke storage aktif. Default
development memakai memory store. Pada mode MySQL, satu transaksi meng-upsert
snapshot terbaru per device untuk dashboard live dan bucket agregat 5 menit
untuk history. Row agregat menyimpan mean, min, max, dan jumlah sampel; raw
payload lengkap tidak ditumpuk pada setiap row history baru.

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

Untuk menguji payload real-format tanpa menunggu device fisik, jalankan aplikasi secara lokal
lalu kirim ke alamat lokal memakai device contoh:

```powershell
$env:PILOT_API_BASE_URL="http://localhost:3000"
$env:PILOT_DEVICE_ID="demo-tph-01"
$env:PILOT_DEVICE_KEY="demo-tph-key"
pnpm pilot:smoke --allow-config-review
```

Payload ini membawa config tangki yang berbeda dari device contoh, jadi balasannya wajar
memuat `needsReview=true`; opsi `--allow-config-review` membuat skrip tetap menganggapnya
berhasil. Smoke test ke alamat pilot hanya dijalankan pemelihara yang berwenang, memakai
device yang memang disepakati untuk tes.

Jika ingin melihat payload tanpa mengirim:

```powershell
pnpm pilot:smoke --dry-run
```

Jika smoke test gagal:

| Status             | Arti                                                       |
| ------------------ | ---------------------------------------------------------- |
| `401`              | key salah atau hash di registry tidak cocok                |
| `404`              | device belum ada di registry aktif                         |
| `429`              | terlalu banyak kiriman dalam satu menit                    |
| `500`              | gagal menyimpan ke storage aktif (misalnya MySQL mati)     |
| `needsReview=true` | payload masuk, tetapi config payload berbeda dari registry |

## Device Contoh yang Tersedia

| Device        | Tangki          |
| ------------- | --------------- |
| `demo-tph-01` | `tank-tph-main` |
| `demo-nja-01` | `tank-nja-main` |
| `demo-jto-01` | `tank-jto-main` |
| `demo-skp-01` | `tank-skp-main` |

## Yang Sudah Dikunci dan yang Belum

Sudah dikunci (per Oktober 2026):

- format kiriman dan alamat `/api/ingest` (kontrak perangkat v1, firmware v1);
- kunci per perangkat, disimpan sebagai hash di database;
- tinggi, volume, dan persen isi memakai nilai dari perangkat bila dikirim; bila tidak, server
  menghitungnya dari jarak sensor dan config tangki (lihat [model domain](domain-model.md)).

Belum final:

- interval kirim yang baku (perangkat pilot sekitar 20 detik);
- metode kalibrasi dan posisi sensor per lokasi;
- cara rotasi kunci bila perangkat diganti atau kunci bocor.

## Catatan Keamanan

Jangan menaruh key production di kode.

Yang sudah berjalan: hash kunci per perangkat di database, HTTPS, dan batas jumlah kiriman.

Yang tetap perlu dijaga di production:

- matikan kunci cadangan global (`SOLAR_TANK_ALLOW_GLOBAL_DEVICE_KEY_FALLBACK="false"`);
- rotasi kunci bila perangkat hilang atau kunci bocor;
- catatan audit untuk kiriman perangkat belum ada.
