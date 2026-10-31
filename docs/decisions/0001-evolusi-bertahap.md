# ADR 0001 — Evolusi bertahap, bukan membangun ulang dari nol

- **Status:** Diterima
- **Tanggal:** 2026-10-25 (diterima)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- FTM sudah dipakai sebagai pilot operasional: perangkat lapangan mengirim data setiap ±20 detik dan pengguna membuka dashboard setiap hari.
- Fondasi kodenya layak dirawat: TypeScript ketat, 160 tes otomatis yang lulus, transaksi database dengan penguncian baris, hash kata sandi Argon2id, token HMAC, dan kunci rahasia per perangkat.
- Masalah terbesar yang tercatat per Oktober 2026 bersifat operasional (backup, hosting, keamanan perangkat, kalibrasi). Masalah itu tidak selesai dengan mengganti framework.
- Masalah kode bersifat lokal: beberapa file sangat besar, tampilan yang berulang, beberapa halaman yang melompati lapisan, dan ambang status yang ditulis di beberapa tempat.

## Keputusan

FTM dikembangkan dengan merapikan sistem yang ada sedikit demi sedikit. Setiap perapian dilindungi tes dan tidak boleh mengubah perilaku yang dirasakan pengguna maupun perangkat, kecuali paket kerjanya menyebut perubahan itu secara eksplisit. Hanya modul yang terbukti tidak bisa dirapikan yang boleh ditulis ulang, dan itu pun satu modul saja.

## Pilihan yang dipertimbangkan

### Membangun ulang dari nol dengan stack baru

- Kelebihan: Bisa memulai dengan struktur bersih.
- Kekurangan: Harus mengejar semua fitur (44 rute, alur pengajuan perangkat, akun, ekspor, helpdesk, Telegram) sambil tetap merawat sistem lama; risiko terbesar tetap ada.
- Hasil: Tidak dipilih.

### Memecah menjadi banyak layanan kecil (microservices)

- Kelebihan: Batas antarbagian sangat tegas.
- Kekurangan: Beban data FTM kecil (puluhan perangkat); banyak layanan menambah deployment, jaringan, dan autentikasi antarlayanan.
- Hasil: Tidak dipilih.

### Evolusi bertahap pada sistem yang ada

- Kelebihan: Risiko migrasi paling kecil; pilot tetap berjalan; setiap langkah bisa diperiksa.
- Kekurangan: Butuh disiplin tes dan langkah kecil.
- Hasil: Dipilih.

## Konsekuensi

- Pekerjaan dibagi menjadi paket kerja kecil: pahami → rekam perilaku awal → ubah → buktikan sama → gabungkan.
- Tes karakterisasi (tes yang mengunci perilaku sekarang) ditulis sebelum kode dipindah.

## Risiko dan mitigasi

- Risiko: Perapian tidak sengaja mengubah angka atau status.
  - Mitigasi: Bukti paritas wajib di setiap pull request: tes, rekaman respons API, dan screenshot sebelum/sesudah.

## Cara meninjau ulang

Bila satu modul inti tetap tidak bisa diberi tes regresi setelah dua kali percobaan, modul itu saja yang dipertimbangkan untuk ditulis ulang.
