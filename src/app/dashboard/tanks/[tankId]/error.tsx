"use client";

type TankDetailErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function TankDetailError({
  error,
  unstable_retry,
}: TankDetailErrorProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf8] px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
          Detail tangki belum siap
        </p>
        <h1 className="mt-3 break-words text-2xl font-semibold tracking-normal sm:text-3xl">
          Detail monitoring belum bisa dibaca
        </h1>
        <p className="mt-3 break-words text-sm leading-6 text-zinc-600">
          Halaman detail gagal mengambil data dari storage aktif. Cek endpoint
          /api/ready dan pastikan database atau mode memory berjalan sesuai
          konfigurasi. Jika baru mengubah .env.local, hentikan lalu jalankan
          ulang pnpm dev karena env dibaca saat proses server dimulai.
        </p>
        <p className="mt-3 break-words text-sm leading-6 text-zinc-600">
          Tombol coba lagi hanya mencoba render ulang setelah database, network,
          atau konfigurasi server sudah benar. Tombol ini tidak bisa menyalakan
          database dan tidak bisa memuat ulang perubahan .env.local.
        </p>

        {error.digest ? (
          <p className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-500">
            Referensi error: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Coba lagi
          </button>
          <a
            href="/api/ready"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-200 px-5 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            Cek /api/ready
          </a>
        </div>
      </section>
    </main>
  );
}
