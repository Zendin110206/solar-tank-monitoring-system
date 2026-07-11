# Current Operational Truth

Tanggal status: 2026-07-11

Dokumen ini menjadi ringkasan kebenaran operasional saat ini. Jika dokumen lama di repo atau `local_context` bertentangan dengan dokumen ini, gunakan dokumen ini sebagai acuan sementara lalu update dokumen lama yang tertinggal.

## Status Produk Saat Ini

SolarTank masih prototipe aktif, tetapi sudah melewati fase dashboard dummy. Sistem sekarang sudah memiliki alur monitoring, auth, pengajuan device, pembuatan paket firmware, first valid ping activation, reset reading aman, export CSV reading berbasis periode, dukungan backup MySQL manual/terjadwal, dan cleanup data device.

Sistem belum boleh disebut production-ready penuh karena deployment production final, restore drill, kalibrasi device lapangan, dan SOP operasional belum selesai diuji.

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
- Download CSV reading dari halaman detail tangki dengan periode 1 hari, 7 hari, atau 30 hari mengikuti pilihan grafik.
- Admin reset reading per STO dan reset semua reading tanpa menghapus registry/device.
- Admin cleanup untuk data STO/device/uji tanpa menghapus akun user/admin, template firmware, atau hardware profile.
- Script backup MySQL `pnpm db:backup:mysql` dan wrapper Task Scheduler `scripts/run-mysql-backup-task.ps1`.
- Health check `/api/health` dan readiness check `/api/ready`.
- Test suite dan CI `pnpm check`.

## Yang Belum Final

- Deployment production final dan SOP operasional server pilihan akhir.
- Restore database yang diuji rutin.
- Monitoring/log service production.
- Alert operasional level kritis/offline.
- Telegram approve/reject device request. Saat ini Telegram untuk binding dan notifikasi, bukan approval utama.
- RTU/Modbus/OPNIMUS integration. Ini fase lanjutan setelah web monitoring 5 STO stabil.
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

Untuk pilot/operasional:

- gunakan `SOLAR_TANK_STORAGE_DRIVER=mysql`;
- matikan fallback global device key;
- siapkan SMTP, auth secret, package encryption key, backup output dir, dan admin bootstrap;
- cek `/api/ready` sebelum menganggap sistem siap;
- jalankan `pnpm db:backup:mysql` sebelum migration besar, cleanup besar, atau deploy;
- jalankan `pnpm db:migrate:reading-rollup` sebelum men-deploy writer snapshot/rollup;
- uji restore backup ke database staging/lokal sebelum mengklaim SOP backup final.

Detail deployment pilihan akhir belum dipublikasikan di repo utama pada status ini. Jalur tersebut ditunda sampai keputusan tim berikutnya.

## Catatan Data

Data demo, data pilot, dan data real harus dipisahkan.

- `config/pilot-registry.example.json` hanya template aman.
- `config/pilot-registry.local.json` jika ada adalah private dan tidak boleh commit.
- Seed MySQL demo bukan bukti data real.
- Screenshot/chat lama tidak boleh dijadikan sumber data operasional tanpa verifikasi.
