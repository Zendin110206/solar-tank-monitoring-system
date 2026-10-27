const workflowSteps = [
  {
    number: "1",
    title: "Perangkat mengirim pembacaan",
    description:
      "Sensor atau simulator membaca kondisi tangki, lalu mengirim data ke endpoint API dengan identitas perangkat.",
    badge: "Kirim data",
  },
  {
    number: "2",
    title: "API menyimpan pembacaan",
    description:
      "Server menerima data perangkat, menyimpan riwayat, dan menyiapkan data terbaru agar dashboard tidak membaca sensor secara langsung.",
    badge: "/ingest",
  },
  {
    number: "3",
    title: "Dashboard membantu tindak lanjut",
    description:
      "Operator melihat volume, estimasi runtime, status risiko, dan prioritas lokasi yang perlu dicek di lapangan.",
    badge: "Dashboard",
  },
];

export function LandingWorkflow() {
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1480px]">
        <div className="animate-soft-fade reveal-on-scroll mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-xl shadow-red-600/30">
            <span className="size-2 rounded-full bg-white/50" />
            Cara Kerja
          </span>
          <h2 className="mt-10 text-[clamp(1.75rem,4.2vw,3.75rem)] font-medium leading-[1.08] tracking-normal text-zinc-950">
            Alur kerja dalam{" "}
            <span className="font-serif italic text-red-600">tiga</span>{" "}
            {"langkah"}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
            Sistem dirancang mengikuti pola existing yang sudah terbukti:
            perangkat mengirim data, server menyiapkan informasi, lalu dashboard
            membantu keputusan operasional.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="animate-soft-fade reveal-on-scroll relative">
            <div className="absolute bottom-8 left-5 top-8 hidden w-px bg-zinc-200 sm:block" />
            <div className="space-y-10">
              {workflowSteps.map((step) => (
                <article
                  key={step.number}
                  className="relative grid gap-5 sm:grid-cols-[2.75rem_1fr]"
                >
                  <div className="relative z-10 grid size-11 place-items-center rounded-full bg-red-50 text-base font-semibold text-red-600 ring-8 ring-white">
                    {step.number}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-zinc-950">
                        {step.title}
                      </h3>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500">
                        {step.badge}
                      </span>
                    </div>
                    <p className="mt-4 max-w-xl text-base leading-8 text-zinc-600">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="animate-soft-fade reveal-on-scroll-slow overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm sm:p-8">
            <div className="relative min-h-[31rem] overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 sm:p-10">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #e5e7eb 1px, transparent 1.25px)",
                  backgroundSize: "14px 14px",
                }}
              />
              <div className="absolute inset-x-10 top-1/2 h-px bg-zinc-200" />
              <div className="absolute left-[20%] right-[20%] top-1/2 h-px bg-red-200" />

              <div className="relative z-10 mx-auto h-[28rem] max-w-3xl">
                <div
                  className="animate-soft-float absolute left-0 top-16 w-44 rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/80"
                  style={{ "--float-rotate": "-6deg" } as React.CSSProperties}
                >
                  <p className="text-sm font-semibold text-zinc-500">
                    Perangkat
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <span className="h-10 rounded-lg bg-cyan-400" />
                    <span className="h-10 rounded-lg bg-emerald-500" />
                    <span className="h-10 rounded-lg bg-red-500" />
                    <span className="h-10 rounded-lg bg-amber-400" />
                  </div>
                  <p className="mt-4 text-xs leading-5 text-zinc-500">
                    Sensor membaca level tangki.
                  </p>
                </div>

                <div className="absolute left-1/2 top-8 w-52 -translate-x-1/2 rounded-lg bg-red-600 p-6 text-white shadow-2xl shadow-red-500/30">
                  <p className="text-sm font-semibold text-white/70">
                    Endpoint
                  </p>
                  <p className="mt-4 text-4xl font-semibold">/ingest</p>
                  <div className="mt-5 rounded-lg bg-white/15 px-4 py-3 text-sm">
                    validasi device id dan API key
                  </div>
                </div>

                <div
                  className="animate-soft-float absolute right-0 top-20 w-48 rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/80"
                  style={{ "--float-rotate": "6deg" } as React.CSSProperties}
                >
                  <p className="text-sm font-semibold text-zinc-500">
                    Dashboard
                  </p>
                  <div className="mt-5 space-y-3">
                    {["Latest", "History", "Runtime"].map((label) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-zinc-800">
                          {label}
                        </span>
                        <span className="size-2 rounded-full bg-red-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 w-full max-w-lg -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-200/90">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-500">
                        Hasil operasional
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-950">
                        STO prioritas terlihat lebih cepat
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                      siap tindak lanjut
                    </span>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Volume", "3.900 L"],
                      ["Runtime", "18 jam"],
                      ["Status", "Aman"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          {label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-zinc-950">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
