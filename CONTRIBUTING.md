# Panduan Kontribusi

Repositori ini sedang berada pada fase fondasi. Kontribusi perlu menjaga struktur tetap rapi, aman, dan mudah dilanjutkan.

## Aturan Kerja

- Jangan melakukan commit kredensial, API key, token, password, atau konfigurasi produksi.
- Gunakan data dummy atau payload simulator untuk contoh.
- Pisahkan logika domain dari komponen UI.
- Tulis asumsi teknis jika detail perangkat atau deployment belum final.
- Gunakan commit kecil dan mudah ditinjau.
- Jalankan pengecekan lokal sebelum push.

## Gaya Commit

Gunakan format commit yang singkat dan konsisten:

```text
docs(readme): revisi dokumentasi repositori
chore(repo): rapikan struktur folder
feat(domain): tambah perhitungan volume tangki
test(domain): tambah test status runtime
```

## Pengecekan Lokal

Sebelum push perubahan implementasi, jalankan:

```powershell
pnpm check
```
