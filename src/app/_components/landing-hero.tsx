const tankStatus = [
  {
    name: "STO Utama",
    level: "78%",
    runtime: "18 jam",
    bar: "w-[78%] bg-cyan-500",
  },
  {
    name: "STO Timur",
    level: "42%",
    runtime: "13 jam",
    bar: "w-[42%] bg-amber-500",
  },
];

const siteStats = [
  ["3", "site terdaftar"],
  ["20 dtk", "refresh dashboard"],
  ["5 mnt", "resolusi riwayat"],
];

export function LandingHero() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] w-full max-w-full overflow-hidden border-t border-zinc-100">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle, #dce3ea 1px, transparent 1.35px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/70 to-white" />

      <div
        className="animate-soft-float absolute left-8 top-20 hidden lg:block"
        style={{ "--float-rotate": "-8deg" } as React.CSSProperties}
      >
        <div className="h-44 w-52 rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-300/40" />
      </div>

      <div
        className="animate-soft-float absolute left-16 top-24 hidden lg:block"
        style={{ "--float-rotate": "3deg" } as React.CSSProperties}
      >
        <div className="relative h-40 w-56 bg-[#fff18a] px-7 py-6 text-lg font-medium leading-7 shadow-xl shadow-zinc-300/40">
          <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-red-500 shadow" />
          Catat stok bahan bakar, cek runtime genset, dan pantau status STO.
        </div>
      </div>

      <div className="absolute left-32 top-[23rem] hidden size-24 rounded-lg bg-white shadow-2xl shadow-zinc-300/50 lg:grid lg:place-items-center">
        <div className="grid size-14 place-items-center rounded-lg bg-blue-600 text-4xl font-semibold text-white shadow-lg shadow-blue-500/30">
          <span className="-mt-1">✓</span>
        </div>
      </div>

      <div
        className="animate-soft-float absolute right-10 top-24 hidden h-48 w-56 rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-300/40 lg:block"
        style={{ "--float-rotate": "12deg" } as React.CSSProperties}
      />

      <div
        className="animate-soft-float absolute right-20 top-28 hidden w-64 rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/50 lg:block"
        style={{ "--float-rotate": "6deg" } as React.CSSProperties}
      >
        <p className="text-lg font-semibold">Pengingat operasional</p>
        <div className="mt-5 rounded-full bg-zinc-100 px-4 py-2 text-right text-xs text-zinc-400">
          Jadwal pengecekan
        </div>
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-sm font-semibold">Validasi sensor hari ini</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Cocokkan pembacaan dashboard dengan kondisi lapangan.
          </p>
          <div className="mt-4 rounded-lg bg-cyan-50 px-3 py-2 text-center text-xs font-medium text-cyan-700">
            13:00 - 13:45
          </div>
        </div>
      </div>

      <div
        className="animate-soft-float absolute right-[15rem] top-40 hidden size-16 rounded-lg border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/50 lg:grid lg:place-items-center"
        style={{ "--float-rotate": "6deg" } as React.CSSProperties}
      >
        <div className="relative size-10 rounded-full border-4 border-zinc-900">
          <span className="absolute left-1/2 top-1/2 h-4 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rotate-[-25deg] rounded-full bg-red-500" />
          <span className="absolute left-1/2 top-1/2 h-3.5 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rotate-[110deg] rounded-full bg-zinc-900" />
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950" />
        </div>
      </div>

      <div className="absolute bottom-10 left-12 hidden w-[25rem] rounded-lg border border-zinc-200 bg-white/95 p-6 shadow-2xl shadow-zinc-300/50 xl:block">
        <p className="text-lg font-semibold">Ilustrasi status tangki</p>
        <div className="mt-5 space-y-4">
          {tankStatus.map((tank) => (
            <div
              key={tank.name}
              className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{tank.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Estimasi {tank.runtime}
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-700">
                  {tank.level}
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-zinc-200">
                <div className={`h-2 rounded-full ${tank.bar}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 right-14 hidden w-[25rem] rounded-lg border border-zinc-200 bg-white/95 p-6 shadow-2xl shadow-zinc-300/50 xl:block">
        <p className="text-lg font-semibold">Pilot operasional aktif</p>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {siteStats.map(([value, label]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-center"
            >
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-xs leading-4 text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="grid size-16 -rotate-6 place-items-center rounded-lg bg-white text-lg font-bold text-red-500 shadow-xl shadow-zinc-300/50">
            STO
          </span>
          <span className="grid size-20 place-items-center rounded-lg bg-white shadow-xl shadow-zinc-300/50">
            <span className="relative grid size-12 place-items-center">
              <span className="absolute size-12 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-4 rounded-full bg-cyan-400" />
              <span className="size-3 rounded-full bg-red-500" />
            </span>
          </span>
          <span className="grid size-16 rotate-6 place-items-center rounded-lg bg-white text-lg font-bold text-blue-600 shadow-xl shadow-zinc-300/50">
            API
          </span>
        </div>
      </div>

      <div className="animate-soft-fade relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center px-6 pb-72 pt-24 text-center sm:px-8 lg:pb-64 lg:pt-32 xl:pb-80">
        <div className="mb-8 grid size-20 grid-cols-2 gap-2.5 rounded-lg border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-300/40">
          <span className="rounded-full bg-cyan-400" />
          <span className="rounded-full bg-zinc-900" />
          <span className="rounded-full bg-zinc-900" />
          <span className="rounded-full bg-red-500" />
        </div>

        <h1 className="w-full max-w-[22rem] text-[clamp(2.1rem,9vw,5.8rem)] font-medium leading-[1.08] tracking-normal sm:max-w-5xl sm:text-[clamp(3rem,6.4vw,5.8rem)]">
          <span className="block sm:inline">Pantau tangki</span>{" "}
          <span className="block sm:inline">solar</span>
          <span className="block pt-3 text-zinc-400">dalam satu dashboard</span>
        </h1>

        <p className="mt-8 w-full max-w-[18rem] text-sm leading-8 text-zinc-700 sm:max-w-2xl sm:text-lg">
          Baca volume, estimasi durasi operasional genset, dan status risiko
          setiap STO dengan tampilan yang rapi dan mudah dipahami.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="/register"
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Daftar sekarang
          </a>
          <a
            href="/login"
            className="w-full sm:w-auto rounded-lg border border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-900 transition hover:border-red-500 hover:text-red-600"
          >
            Masuk
          </a>
        </div>
      </div>
    </section>
  );
}
