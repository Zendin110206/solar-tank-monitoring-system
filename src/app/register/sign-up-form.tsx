"use client";

import { useActionState, useState } from "react";
import { submitRegistration } from "./actions";
import { initialRegisterFormState } from "./form-state";

const inputClassName =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";
const labelClassName =
  "mb-1 block text-[0.82rem] font-semibold text-zinc-800";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.5 10.5 0 0 1 12 4c5.3 0 8.7 4.5 9.6 6a1.8 1.8 0 0 1 0 2c-.4.7-1.5 2.2-3.1 3.5M6.2 6.2C4.2 7.5 2.9 9.3 2.4 10a1.8 1.8 0 0 0 0 2c.9 1.5 4.3 6 9.6 6 1 0 2-.2 2.8-.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M2.4 10a1.8 1.8 0 0 0 0 2c.9 1.5 4.3 6 9.6 6s8.7-4.5 9.6-6a1.8 1.8 0 0 0 0-2C20.7 8.5 17.3 4 12 4S3.3 8.5 2.4 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="11"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
          <EyeIcon hidden={showPassword} />
        </button>
      </div>
    </div>
  );
}

export default function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    submitRegistration,
    initialRegisterFormState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-3" noValidate>
      {/* Identity information */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="fullName">
            Nama lengkap
          </label>
          <input
            autoComplete="name"
            autoFocus
            className={inputClassName}
            defaultValue={state.fields.fullName}
            id="fullName"
            key={`fullName-${state.submissionId}`}
            name="fullName"
            placeholder="Nama sesuai identitas"
            required
            type="text"
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="username">
            Nama pengguna
          </label>
          <input
            autoComplete="username"
            className={inputClassName}
            defaultValue={state.fields.username}
            id="username"
            key={`username-${state.submissionId}`}
            name="username"
            placeholder="Contoh: zaenal.abidin"
            required
            type="text"
          />
        </div>
      </div>

      {/* Company contact information */}
      <div>
        <label className={labelClassName} htmlFor="email">
          Email perusahaan
        </label>
        <input
          autoComplete="email"
          className={inputClassName}
          defaultValue={state.fields.email}
          id="email"
          inputMode="email"
          name="email"
          key={`email-${state.submissionId}`}
          placeholder="nama@perusahaan.co.id"
          required
          type="email"
        />
        <p className="mt-1 text-[0.7rem] leading-4 text-zinc-500">
          Gunakan alamat email kantor, bukan Gmail atau email publik lainnya.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="phone">
            Nomor telepon
          </label>
          <input
            autoComplete="tel"
            className={inputClassName}
            defaultValue={state.fields.phone}
            id="phone"
            inputMode="tel"
            name="phone"
            key={`phone-${state.submissionId}`}
            placeholder="08xxxxxxxxxx"
            required
            type="tel"
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="position">
            Jabatan
          </label>
          <input
            autoComplete="organization-title"
            className={inputClassName}
            defaultValue={state.fields.position}
            id="position"
            key={`position-${state.submissionId}`}
            name="position"
            placeholder="Operator / Teknisi"
            required
            type="text"
          />
        </div>
      </div>

      <div>
        <label className={labelClassName} htmlFor="stoLocation">
          Lokasi kerja (STO)
        </label>
        <input
          autoComplete="organization"
          className={inputClassName}
          defaultValue={state.fields.stoLocation}
          id="stoLocation"
          key={`stoLocation-${state.submissionId}`}
          name="stoLocation"
          placeholder="Contoh: STO TPH"
          required
          type="text"
        />
      </div>

      {/* Account security */}
      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordField
          id="password"
          label="Kata sandi"
          name="password"
          placeholder="Minimal 8 karakter"
        />
        <PasswordField
          id="confirmPassword"
          label="Konfirmasi kata sandi"
          name="confirmPassword"
          placeholder="Ulangi kata sandi"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-zinc-600">
        <input
          className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 accent-blue-600"
          defaultChecked={state.fields.agreementAccepted}
          key={`agreement-${state.submissionId}`}
          name="agreement"
          required
          type="checkbox"
        />
        Saya memastikan data identitas dan lokasi kerja yang dimasukkan sudah
        benar.
      </label>

      {/* Form feedback */}
      {state.status !== "idle" ? (
        <div
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm leading-6 ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      <button
        className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-blue-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Memeriksa data…" : "Daftar sebagai pengguna"}
      </button>
    </form>
  );
}
