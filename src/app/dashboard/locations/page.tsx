import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  MapPin,
  Router,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { TankConfigDraftPanel } from "@/features/monitoring/components/tank-config-draft-panel";

export const metadata: Metadata = {
  title: "Konfigurasi Lokasi & Device | SolarTank",
  description:
    "Persiapan konfigurasi STO, registrasi device, koordinat manual, dan konfigurasi fisik tangki SolarTank.",
};

const preparationItems = [
  {
    label: "Data STO",
    body: "Nama lokasi, area, latitude, dan longitude disiapkan sebagai dasar peta manual.",
    icon: MapPin,
  },
  {
    label: "Registrasi device",
    body: "Kode device dan label perangkat dibuat satu paket dengan STO baru.",
    icon: Router,
  },
  {
    label: "Config tangki",
    body: "Tipe tangki, dimensi, kapasitas, batas level, dan konsumsi per jam.",
    icon: Settings,
  },
];

export default async function DashboardLocationsPage() {
  await requirePageAdmin();

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5faf8] text-zinc-950">
      {/* Configuration Header */}
      <header className="sticky top-0 z-50 overflow-hidden border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-3"
            aria-label="Kembali ke dashboard SolarTank"
          >
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 lg:flex">
            <Link href="/dashboard" className="transition hover:text-red-600">
              Dashboard Ringkas
            </Link>
            <Link
              href="/dashboard/detail#peta"
              className="transition hover:text-red-600"
            >
              Peta STO
            </Link>
            <span className="text-zinc-950">Konfigurasi Lokasi</span>
            <Link
              href="/dashboard/detail#log"
              className="transition hover:text-red-600"
            >
              Log Perangkat
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 sm:inline-flex">
              mode persiapan
            </span>
            <div className="grid size-10 place-items-center rounded-full bg-red-600 text-sm font-semibold text-white">
              ZA
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Configuration Toolbar */}
        <section className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-200"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Kembali ke dashboard
                </Link>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                  konfigurasi lokasi
                </span>
              </div>

              <h1 className="mt-4 max-w-4xl break-words text-[1.75rem] font-semibold leading-[1.08] tracking-normal text-zinc-950 sm:text-4xl lg:text-5xl">
                Persiapan data STO dan device pemantau
              </h1>
              <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-zinc-500 sm:text-base">
                Halaman ini menyiapkan data lokasi, koordinat manual, device,
                dan konfigurasi tangki agar alur monitoring bisa disambungkan
                bertahap tanpa mengganggu dashboard operasional.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {preparationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <span className="grid size-10 place-items-center rounded-lg bg-white text-red-600 ring-1 ring-zinc-200">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-zinc-950">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Location and Device Form Section */}
        <TankConfigDraftPanel />

        {/* Frontend-only Boundary Section */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Batas perubahan data
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Data pada halaman ini belum mengubah registry monitoring.
                  Penyimpanan ke database akan diaktifkan setelah modul
                  manajemen lokasi dan hak akses siap.
                </p>
              </div>
            </div>
          </article>

          <article className="animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Database className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Siap disambungkan bertahap
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Field sudah mengikuti kebutuhan STO, device, koordinat
                  manual, dan konfigurasi tangki agar integrasi penyimpanan
                  nanti tidak perlu mengubah alur tampilan besar-besaran.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
