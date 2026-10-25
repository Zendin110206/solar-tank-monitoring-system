# Kebijakan Keamanan FTM

FTM dipakai sebagai pilot operasional dan repositori ini bersifat publik. Semua
isi repositori harus aman dibaca siapa pun.

## Versi yang didukung

| Branch | Peran | Dukungan keamanan |
|---|---|---|
| `main` | Versi yang berjalan di pilot | Ya |
| `dev` | Integrasi sebelum rilis | Ya, perbaikan dikerjakan di sini lalu dirilis ke `main` |
| branch lain | Pekerjaan sementara | Tidak |

Belum ada rilis bernomor yang didukung terpisah. Riwayat perubahan ada di
[CHANGELOG.md](CHANGELOG.md).

## Melaporkan kerentanan

**Jangan membuat issue publik** untuk dugaan kerentanan.

Gunakan **Report a vulnerability** pada tab **Security** repositori ini
(*private vulnerability reporting*). Bila fitur itu belum tersedia, hubungi
pemilik repositori melalui kanal internal tim yang sudah disepakati.

Laporan sebaiknya memuat:

- ringkasan masalah dan bagian yang terdampak;
- langkah reproduksi minimal;
- kemungkinan dampaknya;
- bukti yang sudah dibersihkan dari informasi rahasia.

Jangan mengirim kata sandi, token aktif, kunci perangkat, data pribadi, atau
data operasional sebagai bukti. Uji hanya di lingkungan lokal; jangan menguji
celah pada aplikasi pilot atau perangkat lapangan.

Target penanganan: konfirmasi penerimaan dalam dua hari kerja dan penilaian awal
dalam lima hari kerja. Rincian kerentanan tidak dipublikasikan sebelum perbaikan
tersedia.

## Menangani rahasia

- Rahasia (URL database, kata sandi, token bot, kunci SMTP, kunci enkripsi paket,
  kunci perangkat) hanya disimpan di pengaturan lingkungan hosting atau di file
  `.env.local` di mesin masing-masing. File `.env*` selain `.env.example` sudah
  diabaikan Git.
- `.env.example` hanya berisi nama variabel dan nilai contoh.
- Rahasia tidak boleh dibagikan lewat chat, issue, pull request, atau tangkapan
  layar. Rahasia yang pernah tersebar dianggap bocor dan harus diganti pada
  layanan penerbitnya.
- Kunci perangkat disimpan di database sebagai hash, bukan nilai asli.
- Backup database, ekspor CSV, dan registry operasional tidak pernah di-commit.

Bila rahasia terlanjur masuk Git:

1. cabut atau ganti rahasia itu pada layanan penerbitnya;
2. beri tahu pemilik repositori lewat kanal privat;
3. periksa kemungkinan penyalahgunaan;
4. tentukan perlu tidaknya pembersihan riwayat Git;
5. catat penyebab dan pencegahannya tanpa menuliskan nilai rahasianya.

Menghapus rahasia dari commit terbaru tidak menghapusnya dari riwayat.

## Perlindungan yang sudah ada (per Oktober 2026)

- Kata sandi disimpan sebagai hash Argon2id.
- Sesi memakai cookie `httpOnly`; peran `admin` dan `user` membatasi halaman.
- Admin dapat diwajibkan memakai OTP lewat email.
- Token sekali pakai (verifikasi email, reset kata sandi) disimpan sebagai hash.
- Aksi admin dilindungi token CSRF.
- Pembatas jumlah permintaan untuk login, pendaftaran, lupa kata sandi, dan
  penerimaan data perangkat.
- Setiap perangkat memakai kunci sendiri; perangkat baru belum aktif sebelum
  kiriman valid pertama.
- Paket firmware disimpan terenkripsi dan diunduh lewat token berbatas waktu dan
  jumlah unduhan.
- Webhook Telegram diverifikasi dengan *secret header*.
- Log audit untuk aktivitas akun dan admin.

## Keterbatasan yang diketahui (per Oktober 2026)

Ringkasan berikut sengaja tidak memuat rincian teknis yang bisa disalahgunakan.

- Pilot belum dikeraskan untuk produksi penuh dan belum diuji penetrasi.
- Beberapa dependensi memiliki kerentanan yang diketahui; pembaruannya
  direncanakan.
- Backup otomatis dan uji pemulihan berkala belum berjalan.
- Akses data belum dibatasi per lokasi.
- Firmware perangkat v1 memerlukan penguatan keamanan komunikasi dan pembaruan
  jarak jauh; penguatannya direncanakan untuk firmware versi berikutnya.
- Header keamanan browser belum lengkap.

Arah perbaikannya dicatat di [catatan keputusan](docs/decisions/README.md).
