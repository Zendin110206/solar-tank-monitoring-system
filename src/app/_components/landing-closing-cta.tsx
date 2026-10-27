export function LandingClosingCta() {
  return (
    <section id="daftar" className="bg-white px-5 pb-24 pt-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-14 text-center shadow-sm sm:px-12 sm:py-20">
        <h2 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">
          Siap memantau operasional tangki STO?
        </h2>
        <p className="mx-auto mt-4 mb-8 max-w-xl text-base text-zinc-600">
          Dapatkan visibilitas penuh terhadap volume bahan bakar dan pantau
          estimasi runtime genset dalam satu dashboard terpusat.
        </p>
        <a
          href="/login"
          className="w-full rounded-lg bg-blue-600 px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
        >
          Masuk ke dashboard sekarang
        </a>
      </div>
    </section>
  );
}
