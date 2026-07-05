type DashboardRouteLoadingProps = {
  label?: string;
  title?: string;
  description?: string;
};

export function DashboardRouteLoading({
  label = "Memuat halaman",
  title = "Menyiapkan data terbaru",
  description = "Sistem sedang membaca data dan menyiapkan tampilan. Halaman akan terbuka otomatis setelah siap.",
}: DashboardRouteLoadingProps) {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <header className="border-b border-zinc-200/70 bg-white/90">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-9 w-32 animate-pulse rounded-lg bg-zinc-100" />
            <span className="h-9 w-24 animate-pulse rounded-lg bg-zinc-100" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            {label}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
          </div>
          <div className="mt-4 h-72 animate-pulse rounded-lg bg-zinc-50" />
        </section>
      </div>
    </main>
  );
}
