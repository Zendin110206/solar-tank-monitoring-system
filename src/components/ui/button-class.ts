// Gaya tombol bersama. Berupa kelas (bukan komponen) karena dipakai di <button> maupun <Link>.

// Tombol utama merah merek Telkom/Infranexia selebar formulir. Tinggi dan ukuran
// huruf ditentukan halaman pemakainya. Sejauh ini hanya dipakai halaman akun.
export const BRAND_BLOCK_BUTTON_CLASS =
  "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-5 font-semibold text-white transition hover:bg-brand-red-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/25 disabled:cursor-not-allowed disabled:opacity-70";

// Tombol kedua (misalnya "Batal") berlatar putih dengan tepi abu-abu.
export const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 disabled:cursor-not-allowed disabled:opacity-60";
