# Current Operational Truth

Tanggal status: 2026-07-14

Dokumen ini menjadi acuan status operasional FTM. Informasi bertanggal
merepresentasikan kondisi pada saat verifikasi dan diperbarui ketika cakupan,
deployment, atau tingkat kesiapan sistem berubah.

## Status Produk Saat Ini

FTM adalah **pilot operasional internal yang aktif**. Sistem menerima telemetry
perangkat fisik melalui deployment Vercel, menyimpannya di Aiven MySQL, dan
menampilkannya kepada pengguna yang telah memperoleh akses. Konteks penerapannya
berada di lingkungan Telkom
Indonesia/Telkominfra untuk TIF area Pasuruan–Sidoarjo.

Sistem sudah memiliki alur monitoring, auth, pengajuan device, pembuatan paket
firmware, first valid ping activation, reset reading aman, export CSV berbasis
periode, backup MySQL, Telegram, helpdesk, serta cleanup data device.

Sistem belum boleh disebut production-ready penuh karena hardening firmware,
restore drill, kalibrasi device lapangan, alerting, pembatasan akses per lokasi,
dan SOP operasional belum selesai diuji.

## Snapshot Terverifikasi 13–14 Juli 2026

| Indikator | Hasil |
|---|---|
| Vercel landing dan health | HTTP 200 |
| Readiness publik tanpa akses admin | HTTP 401, sesuai desain |
| Operational storage | Aiven MySQL aktif |
| Registry MySQL | 3 site, 3 tangki, 3 device |
| Historical telemetry pada snapshot 13 Juli | 9.272 reading |
| Kesegaran perangkat pada snapshot | 2 device fresh, 1 device stale |
| Snapshot live dan rollup 5 menit | Siap digunakan |
| Regional, Wilayah, Area, dan STO | Schema siap digunakan |

Angka tersebut adalah snapshot bertanggal, bukan janji bahwa semua perangkat
selalu online. Target awal 5 STO dan arah ekspansi hingga 29 STO harus dibaca
sebagai rencana bertahap, bukan jumlah deployment yang sudah tercapai.

## Yang Sudah Ada

- Login, register request, email verification, forgot/reset password.
- Session cookie `httpOnly` dan role dasar `admin` / `user`.
- Admin OTP email jika `AUTH_REQUIRE_ADMIN_OTP` aktif.
- Cloudflare Turnstile untuk form publik jika env diaktifkan.
- Admin user management: approve/reject request akses, ubah role, aktivasi/nonaktif, cabut sesi, kirim reset password.
- Audit log auth/admin.
- Account security page: ganti password, lihat sesi, revoke sesi lain, binding Telegram.
- Device request dari user.
- Admin review device request lewat web.
- Sistem membuat site code/device code/device key otomatis.
- Kapasitas tangki dihitung dari dimensi, bukan input manual user.
- Konsumsi solar per jam dihitung dari beban lokasi, kapasitas diesel engine, dan cos phi.
- Low level, critical level, dan interval kirim memakai standar sistem/profile, bukan input bebas user.
- Firmware ZIP dibuat setelah admin approve.
- Firmware ZIP disimpan terenkripsi dan didownload lewat token terbatas.
- Device baru aktif setelah first valid ping dengan key yang cocok.
- `POST /api/ingest` menerima payload device dan menyimpan reading.
- Ingest MySQL menyimpan satu snapshot live per device dan satu rollup history per bucket 5 menit dalam satu transaksi.
- Overview, detail, dan API memilih timestamp paling baru secara konsisten selama transisi writer lama ke writer rollup.
- Ingest punya rate limit saat storage MySQL aktif.
- Dashboard ringkas, dashboard detail, peta, detail tangki, dan grafik trend.
- Lokasi dikelompokkan berurutan sebagai Regional, Wilayah, Area, lalu STO; dashboard dapat mencari dan memfilter setiap tingkat tersebut.
- Download CSV reading dari halaman detail tangki dengan periode 1 hari, 7 hari, atau 30 hari mengikuti pilihan grafik.
- Admin reset reading per STO dan reset semua reading tanpa menghapus registry/device.
- Admin cleanup untuk data STO/device/uji tanpa menghapus akun user/admin, template firmware, atau hardware profile.
- Script backup MySQL `pnpm db:backup:mysql` dan wrapper Task Scheduler `scripts/run-mysql-backup-task.ps1`.
- Health check `/api/health` dan readiness check `/api/ready`.
- Test suite dan CI `pnpm check`.

## Yang Belum Final

- Persetujuan production final dan SOP operasional jangka panjang.
- Restore database yang diuji rutin.
- Monitoring/log service production.
- Alert operasional level kritis/offline.
- Telegram approve/reject device request. Saat ini Telegram untuk binding dan notifikasi, bukan approval utama.
- RTU/Modbus/OPNIMUS integration. Ini fase lanjutan setelah rollout awal stabil.
- Firmware TLS validation final. Template ESP8266 saat ini masih perlu keputusan security sebelum production.
- One-click firmware compile/upload untuk user lapangan.
- Role operasional lebih rinci di luar `admin` dan `user`.
- CRUD UI untuk hardware profile dan firmware template.
- Kalibrasi tangki/device real yang terdokumentasi.

## Alur Resmi Device Baru Saat Ini

```text
User login
  -> ajukan perangkat
  -> sistem hitung kapasitas dan konsumsi
  -> request pending admin
  -> admin approve/reject lewat web
  -> jika approve, sistem buat key dan firmware ZIP
  -> user download firmware dari email/link
  -> user compile/upload firmware
  -> device kirim first valid ping
  -> device aktif dan tampil di dashboard
```

Telegram belum menjadi jalur approve/reject resmi.

## Alur Data Monitoring Saat Ini

```text
Device atau simulator
  -> POST /api/ingest
  -> validasi device id dan key
  -> aktivasi first ping jika memenuhi lifecycle request
  -> normalisasi payload
  -> review config payload vs registry
  -> simpan ke memory; atau pada MySQL:
       -> UPSERT snapshot live per device
       -> UPSERT agregat history 5 menit
  -> dashboard/detail membaca registry dan reading
```

Registry tetap menjadi sumber kebenaran jika payload membawa config yang berbeda jauh.

## Deployment Truth

Untuk development:

- `memory` boleh dipakai.
- data hilang saat server restart.

Untuk pilot/operasional yang berjalan saat ini:

- aplikasi aktif di Vercel;
- database aktif memakai Aiven MySQL;
- gunakan `SOLAR_TANK_STORAGE_DRIVER=mysql`;
- matikan fallback global device key;
- siapkan SMTP, auth secret, package encryption key, backup output dir, dan admin bootstrap;
- cek `/api/ready` sebelum menganggap sistem siap;
- jalankan `pnpm db:backup:mysql` sebelum migration besar, cleanup besar, atau deploy;
- jalankan `pnpm db:migrate:reading-rollup` sebelum men-deploy writer snapshot/rollup;
- uji restore backup ke database staging/lokal sebelum mengklaim SOP backup final.

Deployment Vercel aktif dipakai untuk pilot dan peninjauan tim, tetapi belum
menjadi bukti bahwa seluruh SOP produksi final sudah selesai. Migration
Regional/Wilayah telah diterapkan pada database yang diperiksa dan pemeriksaan
`mysql-location-taxonomy` lulus pada 14 Juli 2026. Environment baru tetap wajib
menjalankan migration yang sama sebelum kode deployment digunakan.

## Catatan Data

Data demo, data pilot, dan data real harus dipisahkan.

- `config/pilot-registry.example.json` hanya template aman.
- `config/pilot-registry.local.json` jika ada adalah private dan tidak boleh commit.
- Seed MySQL demo bukan bukti data real.
- Screenshot/chat lama tidak boleh dijadikan sumber data operasional tanpa verifikasi.
- Angka pada README atau landing harus menyebut tanggal snapshot dan tidak boleh
  mengubah target rollout menjadi klaim deployment aktual.
