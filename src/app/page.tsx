const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Alur Data", href: "#alur-data" },
  { label: "Operasional", href: "#operasional" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Akses", href: "#daftar" },
  { label: "Dashboard", href: "#beranda" },
];

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
  ["13", "STO terpantau"],
  ["5 mnt", "interval baca"],
  ["24/7", "monitoring"],
];

const monitoredSites = [
  {
    code: "TPH",
    name: "STO TPH",
    status: "Online",
    level: "78%",
    runtime: "18 jam",
    tone: "bg-emerald-500",
  },
  {
    code: "NJA",
    name: "STO NJA",
    status: "Waspada",
    level: "42%",
    runtime: "13 jam",
    tone: "bg-amber-500",
  },
  {
    code: "JTO",
    name: "STO JTO",
    status: "Perlu cek",
    level: "19%",
    runtime: "7 jam",
    tone: "bg-red-500",
  },
];

const readingRows = [
  ["Volume", "3.900 L"],
  ["Persen isi", "78%"],
  ["RSSI", "-61 dBm"],
  ["Update", "10 detik lalu"],
];

const runtimeBands = [
  { label: "Kritis", range: "< 13 jam", width: "w-[24%]", tone: "bg-red-500" },
  {
    label: "Waspada",
    range: "13 - 16 jam",
    width: "w-[32%]",
    tone: "bg-amber-500",
  },
  {
    label: "Aman",
    range: "> 16 jam",
    width: "w-[44%]",
    tone: "bg-emerald-500",
  },
];

const workflowSteps = [
  {
    number: "1",
    title: "Perangkat mengirim pembacaan",
    description:
      "Sensor atau simulator membaca kondisi tangki, lalu mengirim data ke endpoint API dengan identitas perangkat.",
    badge: "Device push",
  },
  {
    number: "2",
    title: "API menyiapkan latest dan history",
    description:
      "Server menerima payload, menyimpan riwayat, dan menyiapkan data terbaru agar dashboard tidak membaca sensor secara langsung.",
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

export default function Home() {
  return (
    <main
      id="beranda"
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-zinc-950"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 mx-auto flex h-20 max-w-[1480px] items-center justify-between border-b border-zinc-100 bg-white/85 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <a
          href="#beranda"
          className="flex items-center gap-3"
          aria-label="SolarTank"
        >
          <span
            className="relative grid size-8 place-items-center"
            aria-hidden="true"
          >
            <span className="absolute size-8 rounded-full border-2 border-red-500" />
            <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
            <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
            <span className="size-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-xl font-semibold tracking-normal sm:text-2xl">
            SolarTank
          </span>
        </a>

        <nav className="hidden items-center gap-10 text-sm font-medium text-zinc-800 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition hover:text-red-600"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm font-medium sm:flex">
          <a
            href="/login"
            className="hidden text-zinc-800 transition hover:text-red-600 sm:inline"
          >
            Masuk
          </a>
          <a
            href="/register"
            className="rounded-lg border border-zinc-300 px-5 py-3 text-zinc-900 transition hover:border-red-500 hover:text-red-600"
          >
            Daftar
          </a>
        </div>
      </header>

      {/* Hero Section */}
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
            Catat stok solar, cek runtime genset, dan pantau status STO.
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
          <p className="text-lg font-semibold">Status tangki hari ini</p>
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
          <p className="text-lg font-semibold">13 STO terpantau</p>
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
            <span className="block pt-3 text-zinc-400">
              dalam satu dashboard
            </span>
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

      {/* Features Section */}
      <section id="fitur" className="bg-zinc-50 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1480px]">
          <div className="animate-soft-fade reveal-on-scroll mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-xl shadow-red-600/30">
              <span className="size-2 rounded-full bg-white/50" />
              Fitur
            </span>
            <h2 className="mt-10 text-[clamp(1.75rem,4.2vw,3.75rem)] font-medium leading-[1.08] tracking-normal text-zinc-950">
              Semua kebutuhan monitoring dalam satu tempat
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
                  Monitoring multi-STO
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
                      <span className="-mt-8 text-xs text-zinc-500">
                        online
                      </span>
                    </div>
                  </div>
                  <div className="mt-7 space-y-2">
                    {[
                      ["Online", "bg-emerald-500"],
                      ["Stale", "bg-amber-500"],
                      ["Offline", "bg-red-500"],
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
                    Volume solar diterjemahkan menjadi estimasi durasi
                    operasional, supaya keputusan lapangan tidak berhenti di
                    angka liter saja.
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
                    <p className="text-sm font-semibold">Device</p>
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
                  Pengembangan tetap bisa berjalan dari data dummy atau
                  simulator, lalu disambungkan bertahap ke pembacaan perangkat
                  yang sudah mengirim payload ke endpoint API.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
              langkah
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Sistem dirancang mengikuti pola existing yang sudah terbukti:
              perangkat mengirim data, server menyiapkan informasi, lalu
              dashboard membantu keputusan operasional.
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

      {/* Closing CTA Section */}
      <section
        id="daftar"
        className="bg-white px-5 pb-24 pt-10 sm:px-8 lg:px-12"
      >
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">SolarTank</span>
            <span>&copy; 2026 Hak Cipta Dilindungi.</span>
          </div>
          <p>Solusi Cerdas Pemantauan Tangki Berbasis IoT.</p>
        </div>
      </footer>
    </main>
  );
}
