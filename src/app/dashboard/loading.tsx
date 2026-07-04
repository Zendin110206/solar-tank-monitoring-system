export default function DashboardLoading() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      <header className="border-b border-zinc-200/70 bg-white/90">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="size-8 rounded-full bg-zinc-200" />
            <span className="h-4 w-28 rounded-full bg-zinc-200" />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-9 w-32 rounded-lg bg-zinc-100" />
            <span className="h-9 w-24 rounded-lg bg-zinc-100" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            Memuat dashboard
          </p>
          <div className="mt-4 h-9 max-w-xl rounded-lg bg-zinc-100" />
          <div className="mt-3 h-5 max-w-2xl rounded-lg bg-zinc-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <span className="h-24 rounded-lg bg-zinc-50" />
            <span className="h-24 rounded-lg bg-zinc-50" />
            <span className="h-24 rounded-lg bg-zinc-50" />
          </div>
        </section>
      </div>
    </main>
  );
}
