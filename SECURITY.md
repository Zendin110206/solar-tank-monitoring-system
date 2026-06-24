# Kebijakan Keamanan

## Aturan Repositori Publik

Jangan melakukan commit:

- API key asli;
- kredensial database;
- rahasia perangkat;
- kredensial WiFi;
- telemetri nyata;
- alamat jaringan internal;
- domain produksi;
- token deployment;
- konfigurasi perangkat keras privat.

Gunakan `.env.example` hanya untuk nama variabel dan nilai contoh. Nilai asli harus disimpan di environment lokal atau pengelola rahasia deployment.

## Pelaporan Masalah Keamanan

Jika menemukan masalah keamanan, jangan membuka issue publik yang berisi rahasia, payload sensitif, atau detail eksploitasi. Hubungi pemelihara secara privat dan berikan informasi secukupnya untuk reproduksi.

## Branch yang Didukung

Perbaikan keamanan diarahkan ke branch aktif `main` sampai repositori memiliki branch rilis khusus.
