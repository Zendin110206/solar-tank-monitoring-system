import { STATUS_DOT_CLASS } from "@/components/ui/status-tone";

const monitoredSites = [
  {
    code: "TPH",
    name: "STO TPH",
    status: "Online",
    level: "78%",
    runtime: "18 jam",
    tone: STATUS_DOT_CLASS.success,
  },
  {
    code: "NJA",
    name: "STO NJA",
    status: "Waspada",
    level: "42%",
    runtime: "13 jam",
    tone: STATUS_DOT_CLASS.warning,
  },
  {
    code: "JTO",
    name: "STO JTO",
    status: "Perlu cek",
    level: "19%",
    runtime: "7 jam",
    tone: STATUS_DOT_CLASS.danger,
  },
];

const readingRows = [
  ["Volume", "3.900 L"],
  ["Persen isi", "78%"],
  ["RSSI", "-61 dBm"],
  ["Update", "10 detik lalu"],
];

const runtimeBands = [
  {
    label: "Kritis",
    range: "< 13 jam",
    width: "w-[24%]",
    tone: STATUS_DOT_CLASS.danger,
  },
  {
    label: "Waspada",
    range: "13 - 16 jam",
    width: "w-[32%]",
    tone: STATUS_DOT_CLASS.warning,
  },
  {
    label: "Aman",
    range: "> 16 jam",
    width: "w-[44%]",
    tone: STATUS_DOT_CLASS.success,
  },
];

export function LandingFeatures() {
  return (
    <section id="fitur" className="bg-zinc-50 px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1480px]">
        <div className="animate-soft-fade reveal-on-scroll mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-xl shadow-red-600/30">
            <span className="size-2 rounded-full bg-white/50" />
            Fitur
          </span>
          <h2 className="mt-10 text-[clamp(1.75rem,4.2vw,3.75rem)] font-medium leading-[1.08] tracking-normal text-zinc-950">
            Manajemen tangki dalam satu tempat
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
            Dashboard disiapkan untuk membaca data perangkat, melihat kondisi
            terbaru, menelusuri riwayat volume, dan membantu menentukan
            prioritas pengecekan operasional.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="animate-soft-fade reveal-on-scroll overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="relative mx-auto h-[31rem] w-full max-w-[34rem] sm:h-[22rem]">
              <div className="absolute left-0 top-8 w-[62%] rotate-[-5deg] rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/80">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Daftar STO
                  </p>
                  <span className="grid size-7 place-items-center rounded-lg border border-zinc-200 text-sm font-semibold text-red-500">
                    +
                  </span>
                </div>
                <div className="space-y-3">
                  {monitoredSites.map((site) => (
                    <div
                      key={site.code}
                      className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${site.tone}`}
                        />
                        <span className="text-sm font-semibold text-zinc-800">
                          {site.code}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {site.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute right-0 top-20 w-[74%] rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-200/90 sm:w-[68%]">
                <p className="text-sm font-semibold text-zinc-500">
                  Prioritas hari ini
                </p>
                <div className="mt-4 space-y-3">
                  {monitoredSites.map((site) => (
                    <div key={site.name}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-950">
                            {site.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Estimasi {site.runtime}
                          </p>
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                          {site.status}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-zinc-200">
                        <div
                          className={`h-1.5 rounded-full ${site.tone}`}
                          style={{ width: site.level }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-md text-center">
              <h3 className="text-2xl font-semibold text-zinc-950">
                Manajemen multi-STO
              </h3>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Setiap lokasi bisa dipantau dari satu daftar ringkas, sehingga
                STO yang aman, waspada, dan perlu dicek dapat dibedakan tanpa
                membuka banyak halaman.
              </p>
            </div>
          </article>

          <article
            id="alur-data"
            className="animate-soft-fade reveal-on-scroll overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm scroll-mt-24"
          >
            <div className="grid min-h-[22rem] gap-4 md:grid-cols-[0.88fr_1.12fr_0.78fr]">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-zinc-500">
                  Riwayat volume
                </p>
                <div className="mt-8 flex h-44 items-end gap-3">
                  {[48, 62, 58, 71, 64, 78].map((height, index) => (
                    <div
                      key={height}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-32 w-full items-end rounded-full bg-white px-1.5 py-1.5">
                        <span
                          className={`w-full rounded-full ${
                            index === 5 ? "bg-red-500" : "bg-cyan-500"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[0.65rem] text-zinc-400">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">
                      Pembacaan terbaru
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-zinc-950">
                      STO TPH
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Online
                  </span>
                </div>
                <div className="mt-6 grid gap-3">
                  {readingRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                      <span className="text-sm text-zinc-500">{label}</span>
                      <span className="text-sm font-semibold text-zinc-950">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-zinc-500">
                  Kesehatan data
                </p>
                <div
                  className="mx-auto mt-8 grid size-36 place-items-center rounded-full p-4"
                  style={{
                    background:
                      "conic-gradient(#10b981 0 72%, #f59e0b 72% 88%, #ef4444 88% 100%)",
                  }}
                >
                  <div className="grid size-full place-items-center rounded-full bg-zinc-50">
                    <span className="text-3xl font-semibold">72%</span>
                    <span className="-mt-8 text-xs text-zinc-500">online</span>
                  </div>
                </div>
                <div className="mt-7 space-y-2">
                  {[
                    ["Online", STATUS_DOT_CLASS.success],
                    ["Stale", STATUS_DOT_CLASS.warning],
                    ["Offline", STATUS_DOT_CLASS.danger],
                  ].map(([label, tone]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${tone}`} />
                      <span className="text-sm text-zinc-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-8 max-w-2xl text-center">
              <h3 className="text-2xl font-semibold text-zinc-950">
                Latest, history, dan status data
              </h3>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Alur data dibuat jelas: perangkat mengirim pembacaan ke API,
                dashboard mengambil data terbaru, lalu riwayat dipakai untuk
                melihat perubahan volume dari waktu ke waktu.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
          <article
            id="operasional"
            className="animate-soft-fade reveal-on-scroll overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm scroll-mt-24"
          >
            <div className="grid min-h-[24rem] gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="flex flex-col justify-center">
                <h3 className="mt-8 text-3xl font-semibold leading-tight text-zinc-950">
                  Runtime genset dan prioritas risiko
                </h3>
                <p className="mt-5 text-base leading-8 text-zinc-600">
                  Volume bahan bakar diterjemahkan menjadi estimasi durasi
                  operasional, supaya keputusan lapangan tidak berhenti di angka
                  liter saja.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-500">
                        Simulasi runtime
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-950">
                        18 jam 20 menit
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      Aman
                    </span>
                  </div>

                  <div className="mt-8 h-4 overflow-hidden rounded-full bg-zinc-200">
                    <div className="flex h-full">
                      {runtimeBands.map((band) => (
                        <span
                          key={band.label}
                          className={`${band.width} ${band.tone}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {runtimeBands.map((band) => (
                      <div
                        key={band.label}
                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 rounded-full ${band.tone}`}
                          />
                          <span className="text-sm font-semibold text-zinc-950">
                            {band.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-zinc-500">
                          {band.range}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    ["Konsumsi acuan", "25 L/jam"],
                    ["Kapasitas contoh", "5.000 L"],
                    ["Sumber data", "sensor + API"],
                    ["Tindak lanjut", "cek lapangan"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-zinc-200 bg-white p-4"
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
          </article>

          <article className="animate-soft-fade reveal-on-scroll rounded-lg border-2 border-dashed border-zinc-300 bg-white p-6 shadow-sm">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center h-full justify-center pt-8">
              <div className="relative h-40 w-full">
                <div className="absolute left-0 top-6 w-32 rotate-[-6deg] rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-lg shadow-zinc-200/70">
                  <p className="text-sm font-semibold">Simulator</p>
                  <div
                    className="mt-4 h-16 rounded-lg"
                    style={{
                      backgroundColor: "#fff",
                      backgroundImage:
                        "linear-gradient(135deg, #f3f4f6 25%, transparent 25%), linear-gradient(225deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(315deg, #f3f4f6 25%, #fff 25%)",
                      backgroundPosition: "8px 0, 8px 0, 0 0, 0 0",
                      backgroundSize: "16px 16px",
                    }}
                  />
                </div>
                <div className="absolute left-1/2 top-0 w-36 -translate-x-1/2 rounded-lg bg-[#ffdf42] p-4 shadow-xl shadow-zinc-200/80">
                  <p className="text-sm font-semibold">/ingest</p>
                  <p className="mt-3 text-3xl font-semibold">API</p>
                </div>
                <div className="absolute right-0 top-8 w-32 rotate-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-lg shadow-zinc-200/70">
                  <p className="text-sm font-semibold">Perangkat</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="h-9 rounded-lg bg-cyan-400" />
                    <span className="h-9 rounded-lg bg-emerald-500" />
                    <span className="h-9 rounded-lg bg-red-500" />
                    <span className="h-9 rounded-lg bg-amber-400" />
                  </div>
                </div>
              </div>

              <h3 className="mt-8 text-2xl font-semibold text-zinc-950">
                Siap simulator dan perangkat
              </h3>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Pengembangan tetap bisa berjalan dari data contoh dan simulator,
                lalu disambungkan bertahap ke pembacaan perangkat yang mengirim
                data ke endpoint API.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
