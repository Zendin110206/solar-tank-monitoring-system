# ADR 0003 — Tetap memakai Next.js, React, dan TypeScript

- **Status:** Diterima
- **Tanggal:** 2026-10-25 (diterima)
- **Pemilik keputusan:** pemelihara repositori bersama pemilik layanan
- **Terkait:** [indeks keputusan](README.md)

## Konteks

- Tim menguasai Next.js, React, dan TypeScript; kode sekarang ditulis dengan TypeScript ketat dan teruji.
- Route handler Next.js cukup untuk menerima data puluhan perangkat; kecepatan framework bukan hambatan FTM.
- Stack alternatif yang pernah dibahas (Bun, ElysiaJS, Svelte, NestJS) berarti menulis ulang sebagian besar sistem.
- Versi Next.js yang dipakai per Oktober 2026 (16.2.9) memiliki kerentanan yang sudah ditambal di rilis 16.x berikutnya.

## Keputusan

FTM tetap memakai Next.js (App Router), React, dan TypeScript dengan mode ketat, serta Node.js 22 sebagai mesin penjalan. Versi Next.js dinaikkan ke rilis 16.x yang sudah ditambal sebagai bagian dari paket kerja dependensi.

## Pilihan yang dipertimbangkan

### Bun + ElysiaJS + Svelte

- Kelebihan: Modern dan cepat.
- Kekurangan: Menulis ulang seluruh UI dan server; kecocokan modul native (`argon2`) perlu diuji; tidak menutup risiko utama.
- Hasil: Tidak dipilih sekarang.

### Backend NestJS terpisah

- Kelebihan: Struktur backend besar yang matang.
- Kekurangan: Menulis ulang logika server dan memecah aplikasi.
- Hasil: Tidak dipilih sekarang.

### Tetap Next.js + React + TypeScript

- Kelebihan: Tidak ada biaya migrasi; tim sudah menguasai.
- Kekurangan: Harus rajin memperbarui versi framework.
- Hasil: Dipilih.

## Konsekuensi

- Pembaruan keamanan dependensi menjadi pekerjaan rutin (Dependabot dan audit di CI).
- Batas server/klien Next.js dijaga agar kode server tidak masuk ke bundel browser.

## Risiko dan mitigasi

- Risiko: Perubahan perilaku framework saat upgrade.
  - Mitigasi: Upgrade per kelompok dependensi, dengan tes dan smoke test lokal sebelum digabung.

## Cara meninjau ulang

Bila platform pemilik layanan mewajibkan stack lain.
