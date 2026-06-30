"use client";

import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

const inputClassName =
  "h-12 w-full rounded-lg border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";
const labelClassName = "mb-2 block text-sm font-semibold text-zinc-800";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_24px_70px_rgba(24,24,27,0.08)] sm:p-7 lg:p-8"
      noValidate
      onSubmit={handleSubmit}
    >
      {/* Contact form fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="fullName">
            Nama lengkap
          </label>
          <input
            autoComplete="name"
            className={inputClassName}
            id="fullName"
            name="fullName"
            placeholder="Nama petugas"
            required
            type="text"
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="role">
            Peran kerja
          </label>
          <select
            className={inputClassName}
            defaultValue=""
            id="role"
            name="role"
            required
          >
            <option disabled value="">
              Pilih peran
            </option>
            <option>Operator monitoring</option>
            <option>Teknisi lapangan</option>
            <option>Reviewer operasional</option>
            <option>Admin sistem</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClassName} htmlFor="email">
          Email kerja
        </label>
        <input
          autoComplete="email"
          className={inputClassName}
          id="email"
          inputMode="email"
          name="email"
          placeholder="nama@perusahaan.co.id"
          required
          type="email"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="phone">
            Nomor telepon
          </label>
          <input
            autoComplete="tel"
            className={inputClassName}
            id="phone"
            inputMode="tel"
            name="phone"
            placeholder="08xxxxxxxxxx"
            type="tel"
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="site">
            Lokasi atau STO
          </label>
          <input
            className={inputClassName}
            id="site"
            name="site"
            placeholder="Contoh: STO Pasuruan"
            required
            type="text"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClassName} htmlFor="topic">
          Kategori bantuan
        </label>
        <select
          className={inputClassName}
          defaultValue=""
          id="topic"
          name="topic"
          required
        >
          <option disabled value="">
            Pilih kategori
          </option>
          <option>Akses dashboard</option>
          <option>Pembacaan volume tidak sesuai</option>
          <option>Perangkat terlambat mengirim data</option>
          <option>Pengajuan perubahan data lokasi</option>
          <option>Pertanyaan operasional lain</option>
        </select>
      </div>

      <div className="mt-4">
        <label className={labelClassName} htmlFor="message">
          Pesan
        </label>
        <textarea
          className="min-h-36 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          id="message"
          name="message"
          placeholder="Tuliskan kebutuhan bantuan, contoh: data STO Pasuruan belum berubah setelah simulator mengirim pembacaan."
          required
        />
      </div>

      {submitted ? (
        <div className="mt-5 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            Rancangan formulir kontak sudah berjalan sebagai tampilan awal.
            Data belum dikirim ke server sampai modul tiket atau kanal bantuan
            resmi disambungkan.
          </p>
        </div>
      ) : null}

      {/* Visual-only submission */}
      <button
        className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 sm:w-auto"
        type="submit"
      >
        Simulasikan pengiriman
        <Send aria-hidden="true" className="size-4" />
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
