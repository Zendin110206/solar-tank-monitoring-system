import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Fuel,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Kontak Operasional | SolarTank",
  description:
    "Halaman kontak untuk bantuan operasional monitoring SolarTank.",
};

const supportItems = [
  {
    icon: Mail,
    label: "Email",
    value: "Ditentukan oleh administrator saat deployment",
    note: "Tidak memakai alamat pribadi atau credential internal di repo publik.",
  },
  {
    icon: Phone,
    label: "Telepon",
    value: "Kanal operasional internal",
    note: "Nomor resmi mengikuti prosedur area masing-masing.",
  },
  {
    icon: MapPin,
    label: "Acuan lokasi",
    value: "STO Pasuruan",
    note: "Dipakai sebagai konteks awal, bukan data final lapangan.",
  },
];

const operationTags = [
  { label: "STO", icon: MapPin },
  { label: "Tangki solar", icon: Fuel },
  { label: "Perangkat IoT", icon: Wifi },
  { label: "Runtime genset", icon: Clock3 },
  { label: "Dashboard", icon: ShieldCheck },
];

const helpTopics = [
  {
    question: "Apakah formulir ini sudah mengirim tiket?",
    answer:
      "Belum. Pada tahap ini formulir masih menampilkan status pengiriman secara visual dan belum mengirim data ke server.",
  },
  {
    question: "Kapan sebaiknya menghubungi tim operasional?",
    answer:
      "Gunakan halaman ini sebagai rancangan alur bantuan ketika akses sistem monitoring, status perangkat, atau pembacaan volume perlu diklarifikasi.",
  },
  {
    question: "Data apa yang perlu disiapkan?",
    answer:
      "Siapkan nama STO, waktu kejadian, device yang terkait, angka volume atau runtime yang terlihat, dan catatan pengecekan lapangan bila ada.",
  },
  {
    question: "Apakah halaman ini mengubah data monitoring?",
    answer:
      "Tidak. Halaman kontak tidak mengubah API, memory store, simulator, data tangki, atau status monitoring.",
  },
];

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-8 shrink-0 place-items-center"
    >
      <span className="absolute size-8 rounded-full border-2 border-red-500" />
      <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
      <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
      <span className="size-2.5 rounded-full bg-red-500" />
    </span>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link
            aria-label="Buka beranda SolarTank"
            className="flex items-center gap-3"
            href="/"
          >
            <BrandMark />
            <span className="text-xl font-semibold tracking-normal sm:text-2xl">
              SolarTank
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-800 lg:flex">
            <Link className="transition hover:text-red-600" href="/">
              Beranda
            </Link>
            <Link className="transition hover:text-red-600" href="/#fitur">
              Fitur
            </Link>
            <Link className="transition hover:text-red-600" href="/#cara-kerja">
              Cara Kerja
            </Link>
            <Link className="text-red-600" href="/contact">
              Kontak
            </Link>
            <Link className="transition hover:text-red-600" href="/dashboard">
              Dashboard
            </Link>
          </nav>

          <div className="hidden items-center gap-3 text-sm font-medium sm:flex">
            <Link
              className="text-zinc-800 transition hover:text-red-600"
              href="/login"
            >
              Masuk
            </Link>
            <Link
              className="rounded-lg border border-zinc-300 px-5 py-3 text-zinc-900 transition hover:border-red-500 hover:text-red-600"
              href="/register"
            >
              Ajukan akses
            </Link>
          </div>
        </div>
      </header>

      {/* Contact hero and form */}
      <section className="relative px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-24 lg:pt-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle, #dce3ea 1px, transparent 1.35px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-zinc-50" />

        <div className="relative mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="animate-soft-fade">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-xl shadow-red-600/25">
              <LifeBuoy aria-hidden="true" className="size-4" />
              Kontak Operasional
            </div>

            <h1 className="mt-8 max-w-3xl text-[clamp(2.5rem,6vw,5.4rem)] font-medium leading-[1.05] tracking-normal text-zinc-950">
              Butuh bantuan
              <span className="block text-zinc-400">monitoring tangki?</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Hubungi pengelola operasional untuk akses sistem monitoring,
              klarifikasi
              pembacaan volume, atau tindak lanjut perangkat yang terlambat
              mengirim data. Halaman ini disiapkan sebagai rancangan alur
              bantuan operasional.
            </p>

            <div className="mt-10 space-y-4">
              {supportItems.map(({ icon: Icon, label, note, value }) => (
                <article
                  className="grid gap-4 rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-sm sm:grid-cols-[3.25rem_1fr]"
                  key={label}
                >
                  <div className="grid size-12 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">{label}</p>
                    <p className="mt-1 text-base font-semibold text-zinc-950">
                      {value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      {note}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="animate-soft-fade reveal-on-scroll">
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
              Form ini tidak membuat tiket sungguhan dan tidak mengirim data ke
              backend. Integrasi kanal bantuan akan ditangani pada fase
              berikutnya.
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Operational context strip */}
      <section className="bg-zinc-50 px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-center text-sm font-medium text-zinc-500">
            Rancangan kontak ini disiapkan untuk koordinasi bantuan operasional
            monitoring tangki solar.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {operationTags.map(({ icon: Icon, label }) => (
              <div
                className="flex items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-600"
                key={label}
              >
                <Icon aria-hidden="true" className="size-4 text-red-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="reveal-on-scroll">
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium leading-tight text-zinc-950">
              Pertanyaan yang sering muncul
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-zinc-600">
              Bagian ini menjaga ekspektasi agar reviewer paham bahwa halaman
              kontak belum terhubung ke sistem tiket, auth, atau backend.
            </p>
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              href="/dashboard"
            >
              Buka dashboard monitoring
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {helpTopics.map((topic) => (
              <article
                className="reveal-on-scroll rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                key={topic.question}
              >
                <h3 className="text-lg font-semibold text-zinc-950">
                  {topic.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {topic.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">SolarTank</span>
            <span>&copy; 2026 Hak Cipta Dilindungi.</span>
          </div>
          <p>Bantuan operasional monitoring tangki solar berbasis IoT.</p>
        </div>
      </footer>
    </main>
  );
}
