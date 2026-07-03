"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { TurnstileWidget } from "@/features/auth/components/turnstile-widget";

const inputClassName =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";
const labelClassName =
  "mb-1.5 block text-[0.82rem] font-semibold text-zinc-800";

function PasswordField({
  id,
  label,
  name,
  placeholder,
}: {
  id: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          autoComplete="new-password"
          className={`${inputClassName} pr-11`}
          id={id}
          name={name}
          placeholder={placeholder}
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={
            showPassword ? `Sembunyikan ${label}` : `Tampilkan ${label}`
          }
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-400 transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
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
  );
}

function buildAccessReason(formData: FormData): string {
  const position = String(formData.get("position") ?? "").trim();
  const note = String(formData.get("accessReason") ?? "").trim();

  return [`Peran kerja: ${position || "-"}`, note]
    .filter(Boolean)
    .join("\n\n");
}

export default function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    setSubmitted(false);

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/auth/register-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          username: formData.get("username"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          requestedRole: "user",
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
          accessReason: buildAccessReason(formData),
          captchaToken: formData.get("captchaToken"),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error ?? "Pengajuan akses belum bisa diproses.",
        );
      }

      setSubmitted(true);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Pengajuan akses belum bisa diproses.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-5 space-y-3.5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="fullName">
            Nama lengkap
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              autoComplete="name"
              autoFocus
              className={`${inputClassName} pl-10`}
              id="fullName"
              name="fullName"
              placeholder="Nama sesuai identitas"
              required
              type="text"
            />
          </div>
        </div>
        <div>
          <label className={labelClassName} htmlFor="username">
            Nama pengguna
          </label>
          <input
            autoComplete="username"
            className={inputClassName}
            id="username"
            name="username"
            placeholder="Contoh: operator.pasuruan"
            required
            type="text"
          />
        </div>
      </div>

      <div>
        <label className={labelClassName} htmlFor="email">
          Email kerja
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            autoComplete="email"
            className={`${inputClassName} pl-10`}
            id="email"
            inputMode="email"
            name="email"
            placeholder="nama@perusahaan.co.id"
            required
            type="email"
          />
        </div>
        <p className="mt-1 text-[0.72rem] leading-5 text-zinc-500">
          Email ini dipakai admin untuk meninjau dan mengaktifkan akses.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="phone">
            Nomor telepon
          </label>
          <div className="relative">
            <Phone
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              autoComplete="tel"
              className={`${inputClassName} pl-10`}
              id="phone"
              inputMode="tel"
              pattern="(?:[+]?62|0|8)[0-9 .()-]{7,16}"
              name="phone"
              placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
              required
              title="Gunakan nomor seluler Indonesia, contoh 081234567890 atau +6281234567890."
              type="tel"
            />
          </div>
          <p className="mt-1 text-[0.72rem] leading-5 text-zinc-500">
            Nomor akan disimpan konsisten dalam format +62.
          </p>
        </div>
        <div>
          <label className={labelClassName} htmlFor="position">
            Peran kerja
          </label>
          <div className="relative">
            <BriefcaseBusiness
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />
            <select
              className={`${inputClassName} pl-10`}
              defaultValue=""
              id="position"
              name="position"
              required
            >
              <option disabled value="">
                Pilih peran
              </option>
              <option>Operator monitoring</option>
              <option>Teknisi lapangan</option>
              <option>Reviewer operasional</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordField
          id="password"
          label="Kata sandi"
          name="password"
          placeholder="Minimal 10 karakter"
        />
        <PasswordField
          id="confirmPassword"
          label="Konfirmasi sandi"
          name="confirmPassword"
          placeholder="Ulangi kata sandi"
        />
      </div>

      <div>
        <label className={labelClassName} htmlFor="accessReason">
          Catatan akses
        </label>
        <textarea
          className="min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          id="accessReason"
          name="accessReason"
          placeholder="Contoh: perlu memantau status tangki STO area Pasuruan."
        />
      </div>

      <TurnstileWidget />

      {submitted ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          Pengajuan akses diterima. Cek email kerja untuk verifikasi, lalu
          administrator akan meninjau sebelum akun aktif.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {error}
        </div>
      ) : null}

      <button
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Mengirim..." : "Ajukan akses"}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
