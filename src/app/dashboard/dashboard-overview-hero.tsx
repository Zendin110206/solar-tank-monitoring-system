import { ClipboardCheck, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HERO_CONTENT = {
  title: "Ringkasan Operasional",
  descriptionAdmin:
    "Pantau tangki, kelola perangkat, dan tindak lanjuti pengajuan.",
  descriptionUser: "Pantau tangki dan ajukan perangkat baru.",
  addDevice: "Tambah Perangkat",
  reviewRequests: "Tinjau Pengajuan",
} as const;

// Banner pembuka halaman Manajemen Tangki: judul, keterangan, dua tombol
// (Tinjau Pengajuan hanya untuk admin), foto tangki di kanan, dan gelombang
// merah di sudut kanan bawah. Tombol menuju halaman yang sama seperti
// sebelumnya.
export function DashboardOverviewHero({ isAdmin }: { isAdmin: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-r from-white via-slate-50 to-slate-100">
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[48%] sm:block md:w-[52%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,#000_45%),linear-gradient(to_bottom,transparent_0%,#000_22%)]">
        <Image
          alt=""
          className="object-cover object-[62%_58%]"
          fill
          priority
          sizes="(min-width: 768px) 58vw, 48vw"
          src="/brand/ringkasan-latar.webp"
        />
      </div>

      <div className="mx-auto w-full max-w-[1540px] px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-7 lg:px-8">
        <div className="max-w-[30rem] lg:max-w-[36rem]">
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.01em] text-brand-navy-deep sm:text-[1.75rem]">
            {HERO_CONTENT.title}
          </h1>
          <span
            aria-hidden="true"
            className="mt-2 block h-[3px] w-14 rounded-full bg-brand-crimson"
          />
          <p className="mt-2.5 text-sm leading-6 text-zinc-600">
            {isAdmin
              ? HERO_CONTENT.descriptionAdmin
              : HERO_CONTENT.descriptionUser}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-4 text-sm font-semibold text-white shadow-lg shadow-brand-crimson/25 transition-colors duration-150 hover:bg-brand-crimson-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson focus-visible:ring-offset-2"
              href="/dashboard/devices/request"
            >
              <Plus aria-hidden="true" className="size-4" />
              {HERO_CONTENT.addDevice}
            </Link>
            {isAdmin ? (
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-brand-ink shadow-md shadow-zinc-950/5 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40 focus-visible:ring-offset-2"
                href="/dashboard/admin/device-requests"
              >
                <ClipboardCheck aria-hidden="true" className="size-4" />
                {HERO_CONTENT.reviewRequests}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Lengkung bawah: warna latar halaman naik ke kanan, dengan pita
          merah di sepanjang tepinya. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full sm:h-12"
        preserveAspectRatio="none"
        viewBox="0 0 1440 96"
      >
        <defs>
          <linearGradient
            id="dashboard-hero-ribbon"
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="0"
              stopOpacity="0"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0.7"
              stopOpacity="0.9"
            />
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="1"
              stopOpacity="1"
            />
          </linearGradient>
        </defs>
        <path
          d="M0 96V82C500 84 920 78 1150 56C1290 42 1385 24 1440 12V96Z"
          fill="#f5faf8"
        />
        <path
          d="M640 81C940 76 1160 50 1300 30C1370 20 1415 8 1440 0V12C1385 24 1290 42 1150 56C920 78 760 82 640 82Z"
          fill="url(#dashboard-hero-ribbon)"
        />
      </svg>
    </section>
  );
}
