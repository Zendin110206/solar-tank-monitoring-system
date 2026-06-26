"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-zinc-800"
          htmlFor="identity"
        >
          Email atau nama pengguna
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            autoComplete="username"
            autoFocus
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pl-11 pr-4 text-[0.95rem] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            id="identity"
            inputMode="email"
            name="identity"
            placeholder="nama@perusahaan.co.id"
            required
            type="text"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label
            className="text-sm font-semibold text-zinc-800"
            htmlFor="password"
          >
            Kata sandi
          </label>
          <span className="text-xs text-zinc-500">
            Lupa akses? Hubungi administrator
          </span>
        </div>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            autoComplete="current-password"
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pl-11 pr-12 text-[0.95rem] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            id="password"
            name="password"
            placeholder="Masukkan kata sandi"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-zinc-600">
        <input
          className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
          name="remember"
          type="checkbox"
        />
        Ingat perangkat ini
      </label>

      {submitted ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          Tampilan masuk sudah siap. Integrasi autentikasi belum diaktifkan,
          jadi form ini belum membuat sesi login sungguhan.
        </div>
      ) : null}

      <button
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
        type="submit"
      >
        Masuk
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </button>

      <Link
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-red-500 hover:text-red-600"
        href="/dashboard"
      >
        <ShieldCheck aria-hidden="true" className="size-4" />
        Buka dashboard demo
      </Link>
    </form>
  );
}
