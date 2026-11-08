## Ringkasan

Jelaskan perubahan yang dibuat dan hasil yang ingin dicapai, dengan bahasa yang
bisa dipahami orang non-programmer.

## Alasan

Jelaskan masalah atau kebutuhan yang menjadi dasar perubahan. Cantumkan issue
atau catatan keputusan (ADR) yang berkaitan bila ada.

## Ruang lingkup

### Diubah

- Jelaskan perubahan utama.

### Sengaja tidak diubah

- Jelaskan batas yang sengaja tidak disentuh.

## Bukti paritas perilaku

Untuk perapian kode (refactor), pembaruan dependensi, atau perubahan struktur:
tunjukkan bahwa perilaku aplikasi tetap sama. Contoh bukti: tes yang lulus,
perbandingan respons API sebelum dan sesudah, screenshot halaman yang tersentuh
pada lebar 1440, 820, dan 390 px. Sebutkan setiap perbedaan yang memang
disengaja. Tulis "Tidak relevan" bila perubahan hanya dokumentasi.

## Cara verifikasi

Tuliskan perintah dan pemeriksaan manual yang sudah dijalankan beserta hasilnya.

```text
pnpm check
```

## Dampak

- Kontrak perangkat (`/api/ingest`, paket firmware): tidak ada / jelaskan
- Database dan migrasi: tidak ada / jelaskan
- Keamanan dan privasi: tidak ada / jelaskan
- Produksi (pengguna, perangkat lapangan, deployment): tidak ada / jelaskan

## Checklist

- [ ] Perubahan hanya mempunyai satu tujuan utama.
- [ ] Saya sudah membaca seluruh diff.
- [ ] `pnpm check` lulus.
- [ ] Tidak ada perubahan perilaku selain yang disebut di atas.
- [ ] Kontrak perangkat v1 tidak berubah, atau perubahannya dijelaskan dan disetujui.
- [ ] Dokumentasi dan `CHANGELOG.md` diperbarui bila perlu.
- [ ] Tidak ada rahasia, data pribadi, data operasional lokasi, atau catatan lokal.
