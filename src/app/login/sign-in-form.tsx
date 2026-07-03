"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

export default function SignInForm({
  verificationReason,
  verified,
}: {
  verificationReason?: string;
  verified?: "0" | "1";
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const body = challengeId
      ? {
          challengeId,
          code: String(formData.get("otp") ?? ""),
        }
      : {
          identity: String(formData.get("identity") ?? ""),
          password: String(formData.get("password") ?? ""),
        };

    try {
      const response = await fetch(
        challengeId ? "/api/auth/login/verify-otp" : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            data?: {
              requiresOtp?: boolean;
              challengeId?: string;
              delivery?: "email" | "log";
              redirectTo?: string;
            };
          }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Login gagal.");
      }

      if (result.data?.requiresOtp && result.data.challengeId) {
        setChallengeId(result.data.challengeId);
        setMessage(
          result.data.delivery === "log"
            ? "Kode OTP admin dicetak di log server development."
            : "Kode OTP admin sudah dikirim ke email.",
        );
        return;
      }

      router.replace(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Login gagal. Periksa kembali data masuk Anda.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
      {challengeId ? null : (
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
      )}

      {challengeId ? null : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              className="text-sm font-semibold text-zinc-800"
              htmlFor="password"
            >
              Kata sandi
            </label>
            <Link
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              href="/forgot-password"
            >
              Lupa password?
            </Link>
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
      )}

      {challengeId ? (
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            autoComplete="one-time-code"
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pl-11 pr-4 text-center text-[1.05rem] font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            id="otp"
            inputMode="numeric"
            maxLength={6}
            name="otp"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
            type="text"
          />
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          {message}
        </div>
      ) : null}

      {verified === "1" ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Email berhasil diverifikasi. Jika admin sudah menyetujui akses, Anda
          bisa masuk.
        </div>
      ) : null}

      {verified === "0" ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {verificationReason || "Verifikasi email belum berhasil."}
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
        {pending ? "Memproses..." : challengeId ? "Verifikasi kode" : "Masuk"}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
