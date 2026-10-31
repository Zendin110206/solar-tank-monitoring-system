// Gaya tombol bersama. Berupa kelas (bukan komponen) karena dipakai di <button> maupun <Link>.

// Tombol utama selebar formulir (masuk, daftar, atur ulang kata sandi).
export const PRIMARY_BLOCK_BUTTON_CLASS =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70";

// Tombol kedua (misalnya "Batal") berlatar putih dengan tepi abu-abu.
export const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-600/15 disabled:cursor-not-allowed disabled:opacity-60";
